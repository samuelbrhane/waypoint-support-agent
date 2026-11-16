import OpenAI from "openai";
import type { ResponseInputItem } from "openai/resources/responses/responses";

import type { ConversationOutcome } from "@/lib/db/schema";

import { addMessage, currentTurn, loadHistory, setOutcome } from "./conversation";
import { executeToolCall } from "./execute-tool-call";
import { type LoggedStep, StepLogger, measure } from "./logger";
import { buildSystemPrompt } from "./prompt";
import { openAiTools } from "./tools";

const openai = new OpenAI();
const CHAT_MODEL = process.env.CHAT_MODEL ?? "gpt-5.4-mini";
const MAX_MODEL_CALLS = 8;

const FALLBACK_TEXT =
  "Sorry, I couldn't complete this request. Please try again, or ask me to pass it to a human agent.";

export type AgentTurnResult = {
  text: string;
  outcome: ConversationOutcome;
  pendingActionIds: string[];
  ticketNumber: string | null;
};

type TurnOptions = {
  visitorId: string;
  conversationId: string;
  onStep?: (step: LoggedStep) => void;
  onText?: (delta: string) => void;
  onTextReset?: () => void;
};

/** The reply text from a response, collected from its message items. */
function outputText(response: OpenAI.Responses.Response): string {
  return response.output
    .flatMap((item) => (item.type === "message" ? item.content : []))
    .map((part) => (part.type === "output_text" ? part.text : ""))
    .join("");
}

/** Call the model with streaming, passing reply text on as it is written. */
async function callModel(input: ResponseInputItem[], onText?: (delta: string) => void) {
  const stream = await openai.responses.create({
    model: CHAT_MODEL,
    instructions: buildSystemPrompt(new Date()),
    input,
    tools: openAiTools,
    parallel_tool_calls: false,
    stream: true,
  });

  let finalResponse: OpenAI.Responses.Response | null = null;
  let wroteText = false;

  for await (const event of stream) {
    if (event.type === "response.output_text.delta") {
      wroteText = true;
      onText?.(event.delta);
    } else if (event.type === "response.completed") {
      finalResponse = event.response;
    } else if (event.type === "response.failed" || event.type === "error") {
      throw new Error("The model call failed.");
    }
  }

  if (!finalResponse) {
    throw new Error("The model response did not complete.");
  }
  return { response: finalResponse, wroteText };
}

/** Answer the newest customer message: call the model, run its tools, repeat until it replies. */
export async function runAgentTurn({
  visitorId,
  conversationId,
  onStep,
  onText,
  onTextReset,
}: TurnOptions): Promise<AgentTurnResult> {
  const turn = await currentTurn(conversationId);
  const logger = new StepLogger(conversationId, turn, onStep);
  const context = { visitorId, conversationId };

  const history = await loadHistory(conversationId);
  const input: ResponseInputItem[] = history.map((m) => ({ role: m.role, content: m.content }));

  const pendingActionIds: string[] = [];
  let ticketNumber: string | null = null;
  let toolsSucceeded = 0;
  let text = FALLBACK_TEXT;

  for (let call = 1; call <= MAX_MODEL_CALLS; call++) {
    let response: OpenAI.Responses.Response;
    let wroteText: boolean;

    try {
      const measured = await measure(() => callModel(input, onText));
      response = measured.result.response;
      wroteText = measured.result.wroteText;

      const functionCalls = response.output.filter((item) => item.type === "function_call");
      await logger.log({
        type: "model_call",
        output: {
          decision: functionCalls.length > 0 ? "use_tools" : "reply",
          tools: functionCalls.map((c) => c.name),
        },
        durationMs: measured.durationMs,
        inputTokens: response.usage?.input_tokens ?? null,
        outputTokens: response.usage?.output_tokens ?? null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await logger.log({ type: "model_call", error: message });
      onTextReset?.();
      break;
    }

    const functionCalls = response.output.filter((item) => item.type === "function_call");

    // No tools requested: this is the final reply
    if (functionCalls.length === 0) {
      text = outputText(response).trim() || FALLBACK_TEXT;
      break;
    }

    // The model wrote some words before choosing a tool: clear them from the screen
    if (wroteText) {
      onTextReset?.();
    }

    // Keep the model's own output (including its tool requests) in the conversation
    input.push(...(response.output as ResponseInputItem[]));

    for (const functionCall of functionCalls) {
      const result = await executeToolCall(functionCall, context, logger);

      if (result.ok) {
        toolsSucceeded += 1;
        const data = result.data as Record<string, unknown>;

        if (data.status === "awaiting_confirmation") {
          pendingActionIds.push(String(data.action_id));
          await logger.log({
            type: "confirmation_requested",
            toolName: functionCall.name,
            output: { action_id: data.action_id, summary: data.summary },
          });
        }

        if (functionCall.name === "create_ticket") {
          ticketNumber = String(data.ticket_number);
          await logger.log({ type: "escalation", toolName: functionCall.name, output: data });
        }
      }

      input.push({
        type: "function_call_output",
        call_id: functionCall.call_id,
        output: JSON.stringify(result),
      });
    }
  }

  // Escalated, waiting for confirmation, still needs information, or resolved
  const outcome: ConversationOutcome = ticketNumber
    ? "escalated"
    : pendingActionIds.length > 0
      ? "open"
      : toolsSucceeded === 0
        ? "clarification"
        : "resolved";

  await logger.log({ type: "final_answer", output: { text, outcome } });
  await addMessage(conversationId, "assistant", text);
  await setOutcome(conversationId, outcome);

  return { text, outcome, pendingActionIds, ticketNumber };
}