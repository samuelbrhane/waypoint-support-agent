import { and, asc, eq, gt, ne } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { flights } from "@/lib/db/schema";

import { findBooking, formatTime, normalizeRef } from "../booking-data";
import { CHANGE_CUTOFF_HOURS, canChange, changeFee, formatEuros, refundQuote } from "../rules";
import { defineTool } from "./types";

export const checkChangeOptions = defineTool({
  name: "check_change_options",
  description:
    "Check what the customer can do with a booking: whether it can be changed, the change fee and why, " +
    "the alternative flights on the same route, and whether it can be refunded and for how much. " +
    "Use this before offering any rebooking or refund, and quote the fee and reasons it returns. " +
    "This tool only checks; it does not change the booking.",
  schema: z.strictObject({
    booking_ref: z.string().describe("The booking reference, for example VM4821"),
  }),
  async execute({ booking_ref }, { visitorId }) {
    const found = await findBooking(visitorId, booking_ref);

    if (!found) {
      return {
        ok: false,
        error: `No booking found with reference ${normalizeRef(booking_ref)}. Ask the customer to check the reference.`,
        retryable: false,
      };
    }

    const { booking, segments } = found;
    const now = new Date();
    const change = canChange(booking, segments, now);
    const fee = changeFee(booking);
    const refund = refundQuote(booking, segments);

    let alternatives: { flight_number: string; departs: string; arrives: string }[] = [];

    if (change.allowed) {
      const [current] = segments;
      const earliest = new Date(now.getTime() + CHANGE_CUTOFF_HOURS * 3_600_000);

      const options = await db
        .select({
          flightNumber: flights.flightNumber,
          departureAt: flights.departureAt,
          arrivalAt: flights.arrivalAt,
        })
        .from(flights)
        .where(
          and(
            eq(flights.visitorId, visitorId),
            eq(flights.origin, current.origin),
            eq(flights.destination, current.destination),
            ne(flights.flightNumber, current.flightNumber),
            ne(flights.status, "cancelled"),
            gt(flights.departureAt, earliest),
          ),
        )
        .orderBy(asc(flights.departureAt))
        .limit(5);

      alternatives = options.map((f) => ({
        flight_number: f.flightNumber,
        departs: formatTime(f.departureAt),
        arrives: formatTime(f.arrivalAt),
      }));
    }

    return {
      ok: true,
      data: {
        booking_ref: booking.bookingRef,
        change: {
          allowed: change.allowed,
          reason: change.reason,
          fee: formatEuros(fee.cents),
          fee_reason: fee.reason,
          alternatives,
        },
        refund: {
          refundable: refund.refundable,
          amount: formatEuros(refund.amountCents),
          reason: refund.reason,
        },
      },
    };
  },
});