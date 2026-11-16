// Tests per-visitor sample data: creation, no duplicates, locking and reset
import "./load-env";

import { asc, count, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { bookingSegments, bookings, flights } from "@/lib/db/schema";
import { ensureVisitorData, resetVisitorData } from "@/lib/demo";

const A = "test-visitor-a";
const B = "test-visitor-b";

async function countsFor(visitorId: string) {
  const [b] = await db.select({ n: count() }).from(bookings).where(eq(bookings.visitorId, visitorId));
  const [f] = await db.select({ n: count() }).from(flights).where(eq(flights.visitorId, visitorId));
  return `${b.n} bookings, ${f.n} flights`;
}

async function main() {
  // 1. Created once, even when called twice
  await ensureVisitorData(A);
  await ensureVisitorData(A);
  console.log("A after two calls:", await countsFor(A));

  // 2. No duplicates when two requests arrive at the same time
  await Promise.all([ensureVisitorData(B), ensureVisitorData(B)]);
  console.log("B after two parallel calls:", await countsFor(B));

  // 3. The bookings and their flights
  const rows = await db
    .select({
      ref: bookings.bookingRef,
      fare: bookings.fareType,
      tier: bookings.loyaltyTier,
      flight: flights.flightNumber,
      route: flights.origin,
      to: flights.destination,
      departs: flights.departureAt,
      status: flights.status,
    })
    .from(bookings)
    .innerJoin(bookingSegments, eq(bookingSegments.bookingId, bookings.id))
    .innerJoin(flights, eq(flights.id, bookingSegments.flightId))
    .where(eq(bookings.visitorId, A))
    .orderBy(asc(bookings.bookingRef), asc(bookingSegments.position));
  console.table(rows.map((r) => ({ ...r, departs: r.departs.toISOString().slice(0, 16) })));

  // 4. Reset restores a changed booking
  await db.update(bookings).set({ status: "changed" }).where(eq(bookings.visitorId, A));
  await resetVisitorData(A);
  const [vm4821] = await db
    .select({ status: bookings.status })
    .from(bookings)
    .where(eq(bookings.visitorId, A));
  console.log("A after reset:", await countsFor(A), "| status:", vm4821.status);

  // Clean up the test visitors
  await db.delete(bookings).where(inArray(bookings.visitorId, [A, B]));
  await db.delete(flights).where(inArray(flights.visitorId, [A, B]));
  await db.$client.end();
}

main().catch(async (error) => {
  console.error(error);
  await db.$client.end();
  process.exit(1);
});