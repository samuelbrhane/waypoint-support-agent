import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { bookingSegments, bookings, flights } from "@/lib/db/schema";

/** A short view of each of this visitor's bookings, for the demo card. */
export async function listVisitorBookings(visitorId: string) {
  const rows = await db
    .select({
      bookingRef: bookings.bookingRef,
      passenger: bookings.passengerName,
      fareType: bookings.fareType,
      loyaltyTier: bookings.loyaltyTier,
      status: bookings.status,
      flightNumber: flights.flightNumber,
      origin: flights.origin,
      destination: flights.destination,
      departureAt: flights.departureAt,
      flightStatus: flights.status,
    })
    .from(bookings)
    .innerJoin(bookingSegments, eq(bookingSegments.bookingId, bookings.id))
    .innerJoin(flights, eq(flights.id, bookingSegments.flightId))
    .where(eq(bookings.visitorId, visitorId))
    .orderBy(asc(bookings.bookingRef), asc(bookingSegments.position));

  const byRef = new Map<string, (typeof rows)[number] & { flights: string[]; route: string[] }>();

  for (const row of rows) {
    const entry = byRef.get(row.bookingRef);
    if (entry) {
      entry.flights.push(row.flightNumber);
      entry.route.push(row.destination);
    } else {
      byRef.set(row.bookingRef, { ...row, flights: [row.flightNumber], route: [row.origin, row.destination] });
    }
  }

  return [...byRef.values()].map((b) => ({
    bookingRef: b.bookingRef,
    passenger: b.passenger,
    fareType: b.fareType,
    loyaltyTier: b.loyaltyTier,
    status: b.status,
    flights: b.flights,
    route: b.route.join(" → "),
    departureAt: b.departureAt,
    flightStatus: b.flightStatus,
  }));
}