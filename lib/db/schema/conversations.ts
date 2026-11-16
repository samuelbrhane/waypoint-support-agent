import { index, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";

export type ConversationOutcome = "open" | "resolved" | "clarification" | "escalated";
export type MessageRole = "user" | "assistant";

export const conversations = pgTable(
  "conversations",
  {
    id: uuid().primaryKey().defaultRandom(),
    visitorId: text().notNull(),
    title: text().notNull(),
    outcome: text().$type<ConversationOutcome>().notNull().default("open"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("conversations_visitor_idx").on(t.visitorId, t.updatedAt)],
);

export const messages = pgTable(
  "messages",
  {
    id: serial().primaryKey(),
    conversationId: uuid()
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: text().$type<MessageRole>().notNull(),
    content: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_conversation_idx").on(t.conversationId, t.id)],
);