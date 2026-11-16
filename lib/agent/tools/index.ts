import type { FunctionTool } from "openai/resources/responses/responses";
import { z } from "zod";

import { checkChangeOptions } from "./check-change-options";
import { createTicket } from "./create-ticket";
import { lookupBooking } from "./lookup-booking";
import { requestRebooking } from "./request-rebooking";
import { requestRefund } from "./request-refund";
import type { AgentTool } from "./types";

export { runTool } from "./run-tool";
export type { AgentTool, ToolContext, ToolResult } from "./types";

export const tools: AgentTool[] = [
  lookupBooking,
  checkChangeOptions,
  requestRebooking,
  requestRefund,
  createTicket,
];

export const toolsByName = new Map(tools.map((tool) => [tool.name, tool]));

/** The tool definitions sent to OpenAI, built from each tool's Zod schema. */
export const openAiTools: FunctionTool[] = tools.map((tool) => {
  const { $schema: _ignored, ...parameters } = z.toJSONSchema(tool.schema) as Record<string, unknown>;
  return {
    type: "function",
    name: tool.name,
    description: tool.description,
    parameters,
    strict: true,
  };
});