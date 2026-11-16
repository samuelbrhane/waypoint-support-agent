import { pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { conversations } from "./conversations";

export type TicketStatus = "open" | "closed";

export const tickets = pgTable("tickets", {
  id: serial().primaryKey(),
  visitorId: text().notNull(),
  conversationId: uuid().references(() => conversations.id, { onDelete: "set null" }),
  bookingRef: text(),
  summary: text().notNull(),
  reason: text().notNull(),
  status: text().$type<TicketStatus>().notNull().default("open"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});