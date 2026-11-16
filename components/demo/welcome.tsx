"use client";

import { useEffect, useState } from "react";

type Booking = {
  bookingRef: string;
  passenger: string;
  fareType: string;
  loyaltyTier: string;
  status: string;
  flights: string[];
  route: string;
};

const SCENARIOS: Record<string, { shows: string; prompt: string }> = {
  VM4821: { shows: "Free rebooking", prompt: "Can I move my flight VM4821 to a later date?" },
  VM3307: { shows: "Refund after a cancellation", prompt: "My flight VM3307 was cancelled. I want my money back." },
  VM5190: { shows: "Change fee on a Basic fare", prompt: "I want to change VM5190 to a later flight. Is there a cost?" },
  VM2654: { shows: "Gold member exception", prompt: "Can I move VM2654 to the next day? I'm a Gold member." },
  VM6012: { shows: "Handoff to a person", prompt: "I missed my connection on booking VM6012. What now?" },
  VM7745: { shows: "Retry after a system timeout", prompt: "Please move booking VM7745 to flight VM708." },
};

type Props = {
  onAsk: (prompt: string) => void;
  onReset: () => void;
  refreshKey: number;
};

export function Welcome({ onAsk, onReset, refreshKey }: Props) {
  const [bookings, setBookings] = useState<Booking[] | null>(null);

  useEffect(() => {
    fetch("/api/demo/bookings")
      .then((response) => response.json())
      .then((data) => setBookings(data.bookings))
      .catch(() => setBookings([]));
  }, [refreshKey]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">How can Waypoint help?</h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate">
          These are your sample Velmora Air bookings. Pick one to see how Waypoint handles it, or type your own
          question. Nothing here is a real booking, so try anything.
        </p>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {(bookings ?? []).map((booking) => {
          const scenario = SCENARIOS[booking.bookingRef];
          return (
            <li key={booking.bookingRef}>
              <button
                type="button"
                onClick={() => scenario && onAsk(scenario.prompt)}
                className="group w-full rounded-lg border border-line bg-paper p-3 text-left hover:border-ink/40"
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-sm font-medium">{booking.bookingRef}</span>
                  <span className="text-xs text-slate">{booking.status}</span>
                </span>
                <span className="mt-1 block text-sm">{booking.route}</span>
                <span className="mt-1 block text-xs text-slate">
                  {booking.passenger}, {booking.fareType}
                  {booking.loyaltyTier !== "none" ? `, ${booking.loyaltyTier}` : ""}
                </span>
                {scenario && <span className="mt-2 block text-xs font-medium text-radar">{scenario.shows}</span>}
              </button>
            </li>
          );
        })}
        {bookings === null && <li className="text-sm text-slate">Loading your bookings…</li>}
      </ul>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <button
          type="button"
          onClick={() => onAsk("Where is my booking?")}
          className="font-medium underline decoration-line underline-offset-4 hover:decoration-ink"
        >
          Ask without a booking reference
        </button>
        <button type="button" onClick={onReset} className="text-slate hover:text-ink">
          Reset sample bookings
        </button>
      </div>
    </div>
  );
}