import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { bookingSegments, bookings, flights, pendingActions } from "@/lib/db/schema";

import { findBooking, formatTime } from "../booking-data";
import { CHANGE_CUTOFF_HOURS, canChange, formatEuros, refundQuote } from "../rules";

type PendingAction = typeof pendingActions.$inferSelect;
type ApplyResult = { ok: boolean; message: string };

/** Carry out a confirmed action, checking the rules again first. */
export async function applyAction(action: PendingAction): Promise<ApplyResult> {
  const found = await findBooking(action.visitorId, action.bookingRef);
  if (!found) {
    return { ok: false, message: `Booking ${action.bookingRef} could not be found.` };
  }

  return action.action === "rebook" ? applyRebooking(action, found) : applyRefund(found);
}

async function applyRebooking(
  action: PendingAction,
  { booking, segments }: NonNullable<Awaited<ReturnType<typeof findBooking>>>,
): Promise<ApplyResult> {
  const now = new Date();
  const change = canChange(booking, segments, now);
  if (!change.allowed) {
    return { ok: false, message: `This change can no longer be made. ${change.reason}` };
  }

  const { newFlightNumber, feeCents } = action.params as { newFlightNumber: string; feeCents: number };
  const [current] = segments;
  const [target] = await db
    .select()
    .from(flights)
    .where(and(eq(flights.visitorId, action.visitorId), eq(flights.flightNumber, newFlightNumber)))
    .limit(1);

  const stillAvailable =
    target &&
    target.origin === current.origin &&
    target.destination === current.destination &&
    target.status !== "cancelled" &&
    target.departureAt.getTime() > now.getTime() + CHANGE_CUTOFF_HOURS * 3_600_000;

  if (!stillAvailable) {
    return { ok: false, message: `Flight ${newFlightNumber} is no longer available.` };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(bookingSegments)
      .set({ flightId: target.id })
      .where(and(eq(bookingSegments.bookingId, booking.id), eq(bookingSegments.position, 1)));
    await tx.update(bookings).set({ status: "changed" }).where(eq(bookings.id, booking.id));
  });

  const fee = feeCents > 0 ? ` A change fee of ${formatEuros(feeCents)} is charged to your original payment method.` : "";
  return {
    ok: true,
    message: `Done. Booking ${booking.bookingRef} is now on ${target.flightNumber}, departing ${formatTime(target.departureAt)}.${fee}`,
  };
}

async function applyRefund({
  booking,
  segments,
}: NonNullable<Awaited<ReturnType<typeof findBooking>>>): Promise<ApplyResult> {
  const quote = refundQuote(booking, segments);
  if (!quote.refundable) {
    return { ok: false, message: `This refund can no longer be made. ${quote.reason}` };
  }

  await db.update(bookings).set({ status: "refunded" }).where(eq(bookings.id, booking.id));

  return {
    ok: true,
    message:
      `Done. ${formatEuros(quote.amountCents)} will be refunded to your original payment method ` +
      `within 5 to 7 business days. Booking ${booking.bookingRef} is now cancelled.`,
  };
}