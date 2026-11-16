import { Strip, type StripTone } from "@/components/strips";

const STEPS: { tone: StripTone; label: string; title: string; detail?: string; meta?: string }[] = [
  { tone: "decision", label: "Decides", title: "Look up the booking before answering" },
  {
    tone: "tool",
    label: "lookup_booking",
    title: "Flex fare, Rome to Lisbon on 26 Nov at 07:15",
    detail: '{"booking_ref":"VM4821"}',
    meta: "6 ms",
  },
  {
    tone: "tool",
    label: "check_change_options",
    title: "Free change. VM216 and VM217 are available",
    meta: "7 ms",
  },
  { tone: "decision", label: "Decides", title: "Customer chose VM217. Prepare the change" },
  { tone: "waiting", label: "Waiting for you", title: "Move VM4821 to VM217 on 29 Nov at 09:40. No fee." },
  { tone: "done", label: "Confirmed", title: "Booking VM4821 is now on VM217" },
];

export function ReplayRack() {
  return (
    <figure className="rounded-xl border border-paper/10 bg-night-raised/70 p-4 backdrop-blur-sm sm:p-5">
      <div className="mb-4 ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-paper px-4 py-2.5 text-sm text-ink">
        Can I move my flight VM4821 to a later date?
      </div>
      <ol className="space-y-2">
        {STEPS.map((step, index) => (
          <li key={index} className="animate-strip-in" style={{ animationDelay: `${300 + index * 450}ms` }}>
            <Strip {...step} />
          </li>
        ))}
      </ol>
      <figcaption className="mt-4 text-xs text-paper/55">
        Replay of a real Waypoint conversation. Each strip is one step the agent took.
      </figcaption>
    </figure>
  );
}