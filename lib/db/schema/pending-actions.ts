import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { conversations } from "./conversations";

export type ActionType = "rebook" | "refund";
export type ActionStatus = "pending" | "confirmed" | "cancelled" | "failed";

export const pendingActions = pgTable("pending_actions", {
  id: uuid().primaryKey().defaultRandom(),
  conversationId: uuid()
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  visitorId: text().notNull(),
  bookingRef: text().notNull(),
  action: text().$type<ActionType>().notNull(),
  params: jsonb().notNull(),
  summary: text().notNull(),
  status: text().$type<ActionStatus>().notNull().default("pending"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp({ withTimezone: true }),
});