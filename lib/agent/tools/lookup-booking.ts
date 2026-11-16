import { z } from "zod";

import { findBooking, formatTime, normalizeRef } from "../booking-data";
import { detectIssues, formatEuros } from "../rules";
import { defineTool } from "./types";

export const lookupBooking = defineTool({
  name: "lookup_booking",
  description:
    "Look up a booking by its booking reference. Returns the passenger, fare type, loyalty tier, " +
    "booking status, each flight with times and status, and any issues such as delays, " +
    "cancellations or missed connections. Use this first whenever the customer mentions a booking. " +
    "If the customer has not given a booking reference, ask for it instead of guessing one.",
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

    return {
      ok: true,
      data: {
        booking_ref: booking.bookingRef,
        passenger: booking.passengerName,
        fare_type: booking.fareType,
        loyalty_tier: booking.loyaltyTier,
        status: booking.status,
        price_paid: formatEuros(booking.pricePaidCents),
        flights: segments.map((f) => ({
          flight_number: f.flightNumber,
          from: f.origin,
          to: f.destination,
          departs: formatTime(f.departureAt),
          arrives: formatTime(f.arrivalAt),
          status: f.status,
          delay_minutes: f.delayMinutes,
        })),
        issues: detectIssues(segments),
      },
    };
  },
});