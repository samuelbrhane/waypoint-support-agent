import Link from "next/link";

import { ReplayRack } from "./replay-rack";
import { RouteMap } from "./route-map";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <RouteMap />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-24 pt-10 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
        <div className="max-w-xl">
          <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-tight text-paper sm:text-6xl">
            Checks the booking. Asks before it acts. Knows when to call a person.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-paper/70">
            Waypoint is an AI support agent for airlines. It looks up bookings, applies your fare rules, and changes a
            flight or issues a refund only after the customer confirms. Every step it takes is shown as it happens and
            kept in a log your team can review.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/demo" className="rounded-md bg-taxi px-5 py-3 font-medium text-ink hover:bg-taxi/90">
              Try Waypoint
            </Link>
            <a
              href="#how-it-works"
              className="font-medium text-paper underline decoration-paper/30 underline-offset-4 hover:decoration-paper"
            >
              See how it works
            </a>
          </div>
          <p className="mt-5 text-sm text-paper/55">
            The live version runs on Velmora Air, a sample airline with test bookings, so you can rebook and refund
            freely.
          </p>
        </div>
        <ReplayRack />
      </div>
    </section>
  );
}