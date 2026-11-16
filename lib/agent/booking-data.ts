import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { bookingSegments, bookings, flights } from "@/lib/db/schema";

import type { SegmentFlight } from "./rules";

export type BookingRecord = typeof bookings.$inferSelect;

/** Clean up a reference the customer typed, e.g. " vm 4821" becomes "VM4821". */
export function normalizeRef(bookingRef: string): string {
  return bookingRef.replace(/\s+/g, "").toUpperCase();
}

/** Readable time for the model, e.g. "2026-11-26 07:15 UTC". */
export function formatTime(date: Date): string {
  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

/** Load one of this visitor's bookings with its flights in travel order. */
export async function findBooking(
  visitorId: string,
  bookingRef: string,
): Promise<{ booking: BookingRecord; segments: SegmentFlight[] } | null> {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.visitorId, visitorId), eq(bookings.bookingRef, normalizeRef(bookingRef))))
    .limit(1);

  if (!booking) {
    return null;
  }

  const segments = await db
    .select({
      flightNumber: flights.flightNumber,
      origin: flights.origin,
      destination: flights.destination,
      departureAt: flights.departureAt,
      arrivalAt: flights.arrivalAt,
      status: flights.status,
      delayMinutes: flights.delayMinutes,
    })
    .from(bookingSegments)
    .innerJoin(flights, eq(flights.id, bookingSegments.flightId))
    .where(eq(bookingSegments.bookingId, booking.id))
    .orderBy(asc(bookingSegments.position));

  return { booking, segments };
}