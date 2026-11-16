import { and, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { bookingSegments, bookings, flights, pendingActions } from "@/lib/db/schema";

import { buildSampleData } from "./sample-data";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function lockVisitor(tx: Transaction, visitorId: string) {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${visitorId}))`);
}

async function insertSampleData(tx: Transaction, visitorId: string) {
  const data = buildSampleData(new Date());

  const insertedFlights = await tx
    .insert(flights)
    .values(data.flights.map((f) => ({ ...f, visitorId })))
    .returning({ id: flights.id, flightNumber: flights.flightNumber });

  const flightIds = new Map(insertedFlights.map((f) => [f.flightNumber, f.id]));

  for (const { segments, ...booking } of data.bookings) {
    const [row] = await tx
      .insert(bookings)
      .values({ ...booking, visitorId })
      .returning({ id: bookings.id });

    await tx.insert(bookingSegments).values(
      segments.map((flightNumber, index) => ({
        bookingId: row.id,
        flightId: flightIds.get(flightNumber)!,
        position: index + 1,
      })),
    );
  }
}

/** Give a visitor their own copy of the sample bookings, once. */
export async function ensureVisitorData(visitorId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await lockVisitor(tx, visitorId);

    const existing = await tx
      .select({ id: bookings.id })
      .from(bookings)
      .where(eq(bookings.visitorId, visitorId))
      .limit(1);

    if (existing.length === 0) {
      await insertSampleData(tx, visitorId);
    }
  });
}

/** Put a visitor's bookings back to the original sample state. */
export async function resetVisitorData(visitorId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await lockVisitor(tx, visitorId);

    await tx.delete(bookings).where(eq(bookings.visitorId, visitorId));
    await tx.delete(flights).where(eq(flights.visitorId, visitorId));
    await tx
      .update(pendingActions)
      .set({ status: "cancelled", resolvedAt: new Date() })
      .where(and(eq(pendingActions.visitorId, visitorId), eq(pendingActions.status, "pending")));

    await insertSampleData(tx, visitorId);
  });
}