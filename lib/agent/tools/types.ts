import type { z } from "zod";

/** Who is calling the tool. Every query is limited to this visitor's data. */
export type ToolContext = {
  visitorId: string;
  conversationId: string;
  // Everything the customer has written, uppercase without spaces, to check booking references against
  customerText?: string;
};

/** Every tool returns either data or an error the model can act on. */
export type ToolResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string; retryable: boolean };

export type AgentTool<S extends z.ZodType = z.ZodType> = {
  name: string;
  description: string;
  schema: S;
  execute: (input: z.infer<S>, context: ToolContext) => Promise<ToolResult>;
};

/** Keeps each tool's input type tied to its schema. */
export function defineTool<S extends z.ZodType>(tool: AgentTool<S>): AgentTool<S> {
  return tool;
}