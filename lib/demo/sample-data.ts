import type { bookings, flights } from "@/lib/db/schema";

type FlightSeed = Omit<typeof flights.$inferInsert, "id" | "visitorId">;
type BookingSeed = Omit<typeof bookings.$inferInsert, "id" | "visitorId" | "createdAt"> & {
  segments: string[]; // flight numbers, in travel order
};

// A date a number of days from now, at a fixed UTC time
function daysFromNow(now: Date, days: number, hour: number, minute = 0): Date {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour, minute, 0, 0);
  return date;
}

// A time a number of hours ago, rounded to 5 minutes
function hoursAgo(now: Date, hours: number): Date {
  const fiveMinutes = 5 * 60 * 1000;
  return new Date(Math.round((now.getTime() - hours * 3600 * 1000) / fiveMinutes) * fiveMinutes);
}

function flight(
  flightNumber: string,
  origin: string,
  destination: string,
  departureAt: Date,
  durationMinutes: number,
  extra: Partial<FlightSeed> = {},
): FlightSeed {
  const arrivalAt = new Date(departureAt.getTime() + durationMinutes * 60 * 1000);
  return { flightNumber, origin, destination, departureAt, arrivalAt, ...extra };
}

export function buildSampleData(now: Date): { flights: FlightSeed[]; bookings: BookingSeed[] } {
  const flights: FlightSeed[] = [
    // VM4821: Flex fare, plus alternatives for a free rebooking
    flight("VM214", "FCO", "LIS", daysFromNow(now, 10, 7, 15), 165),
    flight("VM216", "FCO", "LIS", daysFromNow(now, 11, 13, 30), 165),
    flight("VM217", "FCO", "LIS", daysFromNow(now, 13, 9, 40), 165),

    // VM3307: cancelled by the airline
    flight("VM402", "AMS", "BCN", daysFromNow(now, 5, 11, 0), 140, { status: "cancelled" }),

    // VM5190: Basic fare, change fee applies
    flight("VM118", "VIE", "CPH", daysFromNow(now, 14, 8, 20), 115),
    flight("VM120", "VIE", "CPH", daysFromNow(now, 15, 17, 5), 115),

    // VM2654: Basic fare, but Gold member changes for free
    flight("VM330", "BCN", "FCO", daysFromNow(now, 8, 15, 45), 105),
    flight("VM332", "BCN", "FCO", daysFromNow(now, 9, 10, 10), 105),

    // VM6012: first flight delayed, connection missed yesterday
    flight("VM508", "CPH", "AMS", hoursAgo(now, 20), 90, { status: "delayed", delayMinutes: 140 }),
    flight("VM612", "AMS", "LIS", hoursAgo(now, 17.5), 175),

    // VM7745: rebooking system fails on the first try
    flight("VM706", "LIS", "VIE", daysFromNow(now, 12, 6, 50), 215),
    flight("VM708", "LIS", "VIE", daysFromNow(now, 13, 14, 25), 215),
  ];

  const bookings: BookingSeed[] = [
    { bookingRef: "VM4821", passengerName: "Elena Marsh", fareType: "flex", pricePaidCents: 18900, segments: ["VM214"] },
    { bookingRef: "VM3307", passengerName: "Tomas Lindqvist", fareType: "basic", pricePaidCents: 12900, segments: ["VM402"] },
    { bookingRef: "VM5190", passengerName: "Priya Nair", fareType: "basic", pricePaidCents: 9900, segments: ["VM118"] },
    { bookingRef: "VM2654", passengerName: "Marco Bellini", fareType: "basic", loyaltyTier: "gold", pricePaidCents: 11900, segments: ["VM330"] },
    { bookingRef: "VM6012", passengerName: "Hannah Okafor", fareType: "flex", loyaltyTier: "silver", pricePaidCents: 34900, segments: ["VM508", "VM612"] },
    { bookingRef: "VM7745", passengerName: "David Chen", fareType: "flex", pricePaidCents: 21900, simulateRebookFailure: true, segments: ["VM706"] },
  ];

  return { flights, bookings };
}