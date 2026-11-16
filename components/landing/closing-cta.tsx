import Link from "next/link";

export function ClosingCta() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="reveal flex flex-col items-start justify-between gap-6 rounded-xl bg-ink px-8 py-10 text-paper md:flex-row md:items-center">
        <div>
          <h2 className="font-display text-4xl font-bold tracking-tight">Ask Waypoint about a booking</h2>
          <p className="mt-2 text-paper/70">Try a rebooking, a refund, or a missed connection and watch every step.</p>
        </div>
        <Link href="/demo" className="shrink-0 rounded-md bg-taxi px-5 py-3 font-medium text-ink hover:bg-taxi/90">
          Try Waypoint
        </Link>
      </div>
    </section>
  );
}