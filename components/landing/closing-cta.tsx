import Link from "next/link";

import { TailFin } from "./tail-fin";

export function ClosingCta() {
  return (
    <section className="relative isolate overflow-hidden bg-night text-paper">
      <div className="mx-auto grid max-w-6xl items-end gap-8 px-6 pt-20 md:grid-cols-[1.2fr_1fr]">
        <div className="reveal pb-20">
          <h2 className="font-display text-5xl font-bold tracking-tight">Ask Waypoint about a booking</h2>
          <p className="mt-3 max-w-md text-lg text-paper/70">
            Try a rebooking, a refund, or a missed connection and watch every step.
          </p>
          <Link
            href="/demo"
            className="mt-8 inline-block rounded-md bg-taxi px-5 py-3 font-medium text-ink hover:bg-taxi/90"
          >
            Try Waypoint
          </Link>
        </div>
        <div className="reveal mx-auto h-64 w-full max-w-sm md:h-80">
          <TailFin />
        </div>
      </div>
    </section>
  );
}