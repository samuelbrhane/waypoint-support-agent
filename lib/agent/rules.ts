import type { BookingStatus, FareType, FlightStatus, LoyaltyTier } from "@/lib/db/schema";

export const CHANGE_FEE_BASIC_CENTS = 6000;
export const FLEX_REFUND_FEE_CENTS = 2500;
export const MIN_CONNECTION_MINUTES = 45;
export const CHANGE_CUTOFF_HOURS = 2;

export type BookingInfo = {
  fareType: FareType;
  loyaltyTier: LoyaltyTier;
  status: BookingStatus;
  pricePaidCents: number;
};

export type SegmentFlight = {
  flightNumber: string;
  origin: string;
  destination: string;
  departureAt: Date;
  arrivalAt: Date;
  status: FlightStatus;
  delayMinutes: number;
};

export function formatEuros(cents: number): string {
  return `${(cents / 100).toFixed(2)} euros`;
}

/** Fee for moving a booking to another flight. */
export function changeFee(booking: BookingInfo): { cents: number; reason: string } {
  if (booking.fareType === "flex") {
    return { cents: 0, reason: "Flex fares can be changed for free." };
  }
  if (booking.loyaltyTier === "gold") {
    return { cents: 0, reason: "Gold members change Basic fares for free." };
  }
  return {
    cents: CHANGE_FEE_BASIC_CENTS,
    reason: `Basic fares have a change fee of ${formatEuros(CHANGE_FEE_BASIC_CENTS)}.`,
  };
}

/** Whether the agent may rebook this booking itself. */
export function canChange(
  booking: BookingInfo,
  segments: SegmentFlight[],
  now: Date,
): { allowed: boolean; reason: string } {
  if (booking.status === "refunded" || booking.status === "cancelled") {
    return { allowed: false, reason: `This booking is ${booking.status}.` };
  }
  if (segments.length > 1) {
    return { allowed: false, reason: "Bookings with connecting flights are changed by the support team." };
  }
  const [flight] = segments;
  if (flight.status === "cancelled") {
    return { allowed: false, reason: "This flight was cancelled by Velmora Air. A full refund is available." };
  }
  const hoursLeft = (flight.departureAt.getTime() - now.getTime()) / 3_600_000;
  if (hoursLeft < CHANGE_CUTOFF_HOURS) {
    return { allowed: false, reason: `Changes close ${CHANGE_CUTOFF_HOURS} hours before departure.` };
  }
  return { allowed: true, reason: "This booking can be changed." };
}

/** How much would be refunded, and why. */
export function refundQuote(
  booking: BookingInfo,
  segments: SegmentFlight[],
): { refundable: boolean; amountCents: number; reason: string } {
  if (booking.status === "refunded") {
    return { refundable: false, amountCents: 0, reason: "This booking has already been refunded." };
  }
  if (segments.some((s) => s.status === "cancelled")) {
    return {
      refundable: true,
      amountCents: booking.pricePaidCents,
      reason: "The flight was cancelled by Velmora Air, so the full fare is refunded.",
    };
  }
  if (booking.fareType === "flex") {
    return {
      refundable: true,
      amountCents: booking.pricePaidCents - FLEX_REFUND_FEE_CENTS,
      reason: `Flex fares are refundable minus a ${formatEuros(FLEX_REFUND_FEE_CENTS)} fee.`,
    };
  }
  return {
    refundable: false,
    amountCents: 0,
    reason: "Basic fares are non-refundable unless Velmora Air cancels the flight.",
  };
}

/** Problems with a journey the customer should know about. */
export function detectIssues(segments: SegmentFlight[]): string[] {
  const issues: string[] = [];

  for (const flight of segments) {
    if (flight.status === "cancelled") {
      issues.push(`Flight ${flight.flightNumber} was cancelled by Velmora Air.`);
    } else if (flight.delayMinutes > 0) {
      issues.push(`Flight ${flight.flightNumber} was delayed by ${flight.delayMinutes} minutes.`);
    }
  }

  for (let i = 0; i < segments.length - 1; i++) {
    const current = segments[i];
    const next = segments[i + 1];
    const actualArrival = current.arrivalAt.getTime() + current.delayMinutes * 60_000;
    const minutesToConnect = (next.departureAt.getTime() - actualArrival) / 60_000;

    if (minutesToConnect < MIN_CONNECTION_MINUTES) {
      issues.push(
        `Missed connection: ${current.flightNumber} arrived too late for ${next.flightNumber}. ` +
          "Disruptions like this need the support team.",
      );
    }
  }

  return issues;
}