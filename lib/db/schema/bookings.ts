import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { flights } from "./flights";

export type FareType = "basic" | "flex";
export type LoyaltyTier = "none" | "silver" | "gold";
export type BookingStatus = "confirmed" | "changed" | "cancelled" | "refunded";

export const bookings = pgTable(
  "bookings",
  {
    id: serial().primaryKey(),
    visitorId: text().notNull(),
    bookingRef: text().notNull(),
    passengerName: text().notNull(),
    fareType: text().$type<FareType>().notNull(),
    loyaltyTier: text().$type<LoyaltyTier>().notNull().default("none"),
    status: text().$type<BookingStatus>().notNull().default("confirmed"),
    pricePaidCents: integer().notNull(),
    simulateRebookFailure: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("bookings_visitor_ref_idx").on(t.visitorId, t.bookingRef)],
);

export const bookingSegments = pgTable("booking_segments", {
  id: serial().primaryKey(),
  bookingId: integer()
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  flightId: integer()
    .notNull()
    .references(() => flights.id, { onDelete: "cascade" }),
  position: integer().notNull(),
});