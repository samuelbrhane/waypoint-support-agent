import { index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export type FlightStatus = "scheduled" | "delayed" | "cancelled";

export const flights = pgTable(
  "flights",
  {
    id: serial().primaryKey(),
    visitorId: text().notNull(),
    flightNumber: text().notNull(),
    origin: text().notNull(),
    destination: text().notNull(),
    departureAt: timestamp({ withTimezone: true }).notNull(),
    arrivalAt: timestamp({ withTimezone: true }).notNull(),
    status: text().$type<FlightStatus>().notNull().default("scheduled"),
    delayMinutes: integer().notNull().default(0),
  },
  (t) => [index("flights_visitor_route_idx").on(t.visitorId, t.origin, t.destination)],
);