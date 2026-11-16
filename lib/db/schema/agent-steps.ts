import { index, integer, jsonb, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { conversations } from "./conversations";

export type StepType =
  | "model_call"
  | "tool_call"
  | "tool_result"
  | "tool_error"
  | "retry"
  | "confirmation_requested"
  | "confirmation_resolved"
  | "escalation"
  | "final_answer";

export const agentSteps = pgTable(
  "agent_steps",
  {
    id: serial().primaryKey(),
    conversationId: uuid()
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    turn: integer().notNull(),
    position: integer().notNull(),
    type: text().$type<StepType>().notNull(),
    toolName: text(),
    input: jsonb(),
    output: jsonb(),
    error: text(),
    durationMs: integer(),
    inputTokens: integer(),
    outputTokens: integer(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("agent_steps_conversation_idx").on(t.conversationId, t.turn, t.position)],
);