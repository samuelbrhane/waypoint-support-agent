import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { bookings, flights } from "@/lib/db/schema";

import { findBooking, formatTime, normalizeRef } from "../booking-data";
import { CHANGE_CUTOFF_HOURS, canChange, changeFee, formatEuros } from "../rules";
import { createPendingAction } from "./pending";
import { defineTool } from "./types";

export const requestRebooking = defineTool({
  name: "request_rebooking",
  description:
    "Prepare moving a booking to another flight on the same route. This does not change the booking: " +
    "it creates a confirmation card that the customer must approve. Only use a flight number returned by " +
    "check_change_options, and only after the customer has chosen it.",
  schema: z.strictObject({
    booking_ref: z.string().describe("The booking reference, for example VM4821"),
    new_flight_number: z.string().describe("The chosen alternative flight, for example VM217"),
  }),
  async execute({ booking_ref, new_flight_number }, context) {
    const found = await findBooking(context.visitorId, booking_ref);
    if (!found) {
      return {
        ok: false,
        error: `No booking found with reference ${normalizeRef(booking_ref)}.`,
        retryable: false,
      };
    }

    const { booking, segments } = found;
    const now = new Date();
    const change = canChange(booking, segments, now);
    if (!change.allowed) {
      return { ok: false, error: change.reason, retryable: false };
    }

    // Demo only: the rebooking system times out once for VM7745
    if (booking.simulateRebookFailure) {
      await db.update(bookings).set({ simulateRebookFailure: false }).where(eq(bookings.id, booking.id));
      return { ok: false, error: "The rebooking system timed out. Try again.", retryable: true };
    }

    const [current] = segments;
    const [target] = await db
      .select()
      .from(flights)
      .where(
        and(
          eq(flights.visitorId, context.visitorId),
          eq(flights.flightNumber, new_flight_number.trim().toUpperCase()),
        ),
      )
      .limit(1);

    const earliest = now.getTime() + CHANGE_CUTOFF_HOURS * 3_600_000;
    const valid =
      target &&
      target.origin === current.origin &&
      target.destination === current.destination &&
      target.flightNumber !== current.flightNumber &&
      target.status !== "cancelled" &&
      target.departureAt.getTime() > earliest;

    if (!valid) {
      return {
        ok: false,
        error: `Flight ${new_flight_number} is not an available alternative. Use check_change_options to list valid flights.`,
        retryable: false,
      };
    }

    const fee = changeFee(booking);
    const feeText = fee.cents === 0 ? "No fee." : `Change fee: ${formatEuros(fee.cents)}.`;
    const summary =
      `Move ${booking.bookingRef} from ${current.flightNumber} (${formatTime(current.departureAt)}) ` +
      `to ${target.flightNumber} (${formatTime(target.departureAt)}). ${feeText}`;

    return createPendingAction(
      context,
      booking.bookingRef,
      "rebook",
      { newFlightNumber: target.flightNumber, feeCents: fee.cents },
      summary,
    );
  },
});