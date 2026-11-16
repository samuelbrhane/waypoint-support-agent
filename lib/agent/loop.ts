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
};

/** Answer the newest customer message: call the model, run its tools, repeat until it replies. */
export async function runAgentTurn({ visitorId, conversationId, onStep }: TurnOptions): Promise<AgentTurnResult> {
  const turn = await currentTurn(conversationId);
  const logger = new StepLogger(conversationId, turn, onStep);
  const context = { visitorId, conversationId };

  const history = await loadHistory(conversationId);
  const input: ResponseInputItem[] = history.map((m) => ({ role: m.role, content: m.content }));

  const pendingActionIds: string[] = [];
  let ticketNumber: string | null = null;
  let text = FALLBACK_TEXT;

  for (let call = 1; call <= MAX_MODEL_CALLS; call++) {
    let response: OpenAI.Responses.Response;
    try {
      const measured = await measure(() =>
        openai.responses.create({
          model: CHAT_MODEL,
          instructions: buildSystemPrompt(new Date()),
          input,
          tools: openAiTools,
          parallel_tool_calls: false,
        }),
      );
      response = measured.result;

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
      break;
    }

    const functionCalls = response.output.filter((item) => item.type === "function_call");

    // No tools requested: this is the final reply
    if (functionCalls.length === 0) {
      text = response.output_text.trim() || FALLBACK_TEXT;
      break;
    }

    // Keep the model's own output (including its tool requests) in the conversation
    input.push(...(response.output as ResponseInputItem[]));

    for (const functionCall of functionCalls) {
      const result = await executeToolCall(functionCall, context, logger);

      if (result.ok) {
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

  const outcome: ConversationOutcome = ticketNumber
    ? "escalated"
    : pendingActionIds.length > 0
      ? "open"
      : text.trim().endsWith("?")
        ? "clarification"
        : "resolved";

  await logger.log({ type: "final_answer", output: { text, outcome } });
  await addMessage(conversationId, "assistant", text);
  await setOutcome(conversationId, outcome);

  return { text, outcome, pendingActionIds, ticketNumber };
}