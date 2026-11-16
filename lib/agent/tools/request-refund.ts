import { z } from "zod";

import { findBooking, normalizeRef } from "../booking-data";
import { formatEuros, refundQuote } from "../rules";
import { createPendingAction } from "./pending";
import { defineTool } from "./types";

export const requestRefund = defineTool({
  name: "request_refund",
  description:
    "Prepare refunding a booking. This does not refund anything yet: it creates a confirmation card " +
    "that the customer must approve. Only use it after the customer has clearly asked for a refund " +
    "and check_change_options has shown the booking is refundable.",
  schema: z.strictObject({
    booking_ref: z.string().describe("The booking reference, for example VM3307"),
  }),
  async execute({ booking_ref }, context) {
    const found = await findBooking(context.visitorId, booking_ref);
    if (!found) {
      return {
        ok: false,
        error: `No booking found with reference ${normalizeRef(booking_ref)}.`,
        retryable: false,
      };
    }

    const { booking, segments } = found;
    const quote = refundQuote(booking, segments);
    if (!quote.refundable) {
      return { ok: false, error: quote.reason, retryable: false };
    }

    const summary =
      `Refund ${formatEuros(quote.amountCents)} for ${booking.bookingRef} to the original payment method. ` +
      "The booking will be cancelled.";

    return createPendingAction(
      context,
      booking.bookingRef,
      "refund",
      { amountCents: quote.amountCents },
      summary,
    );
  },
});