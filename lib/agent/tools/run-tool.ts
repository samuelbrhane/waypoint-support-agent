import type { AgentTool, ToolContext, ToolResult } from "./types";

/** Validate the model's arguments, run the tool, and turn any crash into a ToolResult. */
export async function runTool(
  tool: AgentTool,
  rawArguments: string,
  context: ToolContext,
): Promise<ToolResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawArguments);
  } catch {
    return { ok: false, error: "The tool arguments were not valid JSON.", retryable: false };
  }

  const input = tool.schema.safeParse(parsed);
  if (!input.success) {
    const problems = input.error.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`);
    return { ok: false, error: `Invalid arguments. ${problems.join("; ")}`, retryable: false };
  }

  try {
    return await tool.execute(input.data, context);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `The tool failed unexpectedly: ${message}`, retryable: true };
  }
}