import type { StepLogger } from "./logger";
import { measure } from "./logger";
import { type ToolContext, type ToolResult, runTool, toolsByName } from "./tools";

const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 600;

type FunctionCall = { name: string; arguments: string };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseForLog(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/** Run one tool the model asked for, retrying temporary failures, and log every step. */
export async function executeToolCall(
  call: FunctionCall,
  context: ToolContext,
  logger: StepLogger,
): Promise<ToolResult> {
  await logger.log({ type: "tool_call", toolName: call.name, input: parseForLog(call.arguments) });

  const tool = toolsByName.get(call.name);
  if (!tool) {
    const result: ToolResult = { ok: false, error: `There is no tool called ${call.name}.`, retryable: false };
    await logger.log({ type: "tool_error", toolName: call.name, error: result.error });
    return result;
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const { result, durationMs } = await measure(() => runTool(tool, call.arguments, context));

    if (result.ok) {
      await logger.log({ type: "tool_result", toolName: call.name, output: result.data, durationMs });
      return result;
    }

    if (result.retryable && attempt < MAX_ATTEMPTS) {
      await logger.log({
        type: "retry",
        toolName: call.name,
        error: result.error,
        output: { attempt, next_attempt_in_ms: RETRY_DELAY_MS },
        durationMs,
      });
      await sleep(RETRY_DELAY_MS);
      continue;
    }

    await logger.log({ type: "tool_error", toolName: call.name, error: result.error, durationMs });
    return result;
  }

  // Not reached: the loop always returns, but TypeScript needs an ending
  return { ok: false, error: "The tool could not be run.", retryable: false };
}