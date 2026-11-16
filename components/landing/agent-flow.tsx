"use client";

import { useEffect, useState } from "react";

import { StepIcon, type StepIconName, Strip, type StripTone } from "@/components/strips";

type FlowStep = {
  tone: StripTone;
  icon: StepIconName;
  label: string;
  title: string;
  meta?: string;
  pending: string;
};

const STEPS: FlowStep[] = [
  {
    tone: "decision",
    icon: "think",
    label: "Thinking",
    title: "The customer wants a later flight. Check the booking first",
    pending: "Reading the message",
  },
  {
    tone: "tool",
    icon: "search",
    label: "lookup_booking VM4821",
    title: "Flex fare, Rome to Lisbon on 26 Nov at 07:15",
    meta: "6 ms",
    pending: "Running lookup_booking",
  },
  {
    tone: "tool",
    icon: "rules",
    label: "check_change_options VM4821",
    title: "Free change. VM216 and VM217 are available",
    meta: "7 ms",
    pending: "Running check_change_options",
  },
  {
    tone: "decision",
    icon: "think",
    label: "Thinking",
    title: "The customer chose VM217. Ask before changing anything",
    pending: "Deciding the next step",
  },
  {
    tone: "waiting",
    icon: "wait",
    label: "Waiting for confirmation",
    title: "Move VM4821 to VM217 on 29 Nov at 09:40. No fee.",
    pending: "Preparing the change card",
  },
  {
    tone: "done",
    icon: "done",
    label: "Confirmed by the customer",
    title: "Booking VM4821 is now on VM217",
    pending: "Waiting for the customer",
  },
];

const REPLY = "Done. You're now on VM217, departing 29 Nov at 09:40. No fee was charged.";

const NODE: Record<StripTone, string> = {
  decision: "bg-radar text-paper",
  tool: "bg-glow text-night",
  result: "bg-paper/60 text-night",
  waiting: "bg-taxi text-night",
  done: "bg-go text-paper",
  escalation: "bg-paper text-night",
  error: "bg-stop text-paper",
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function AgentFlow() {
  const [visible, setVisible] = useState(0);
  const [pending, setPending] = useState<string | null>(null);
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(STEPS.length);
      setTyped(REPLY.length);
      return;
    }

    let cancelled = false;

    async function play() {
      while (!cancelled) {
        setVisible(0);
        setTyped(0);
        setPending(null);
        await sleep(700);

        for (let i = 0; i < STEPS.length && !cancelled; i++) {
          setPending(STEPS[i].pending);
          await sleep(STEPS[i].tone === "done" ? 1600 : 850);
          if (cancelled) return;
          setPending(null);
          setVisible(i + 1);
          await sleep(STEPS[i].tone === "waiting" ? 900 : 350);
        }

        for (let c = 0; c <= REPLY.length && !cancelled; c += 2) {
          setTyped(c);
          await sleep(22);
        }

        await sleep(4000);
      }
    }

    play();
    return () => {
      cancelled = true;
    };
  }, []);

  const shown = STEPS.slice(0, visible);

  return (
    <figure className="rounded-xl border border-paper/10 bg-night-raised/70 p-4 backdrop-blur-sm sm:p-5">
      <div className="mb-4 ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-paper px-4 py-2.5 text-sm text-ink">
        Can I move my flight VM4821 to a later date?
      </div>

      <ol className="min-h-[22rem]">
        {shown.map((step, index) => {
          const isLast = index === shown.length - 1;
          const lineContinues = !isLast || pending !== null;

          return (
            <li key={index} className="relative animate-strip-in pb-2 pl-9">
              {lineContinues && (
                <span className="absolute left-[11px] top-6 h-full w-px origin-top animate-line-grow bg-glow/40" />
              )}
              <span
                className={`absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-night-raised ${NODE[step.tone]}`}
              >
                <StepIcon name={step.icon} />
              </span>
              <Strip tone={step.tone} label={step.label} title={step.title} meta={step.meta} compact />
            </li>
          );
        })}

        {pending && (
          <li className="relative animate-strip-in pl-9">
            <span className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center">
              <span className="absolute h-full w-full animate-ping rounded-full bg-taxi opacity-60" />
              <span className="relative h-3 w-3 rounded-full bg-taxi ring-4 ring-night-raised" />
            </span>
            <p className="pt-1 font-mono text-xs text-taxi">{pending}…</p>
          </li>
        )}
      </ol>

      {typed > 0 && (
        <div className="mt-2 flex max-w-[92%] gap-2.5 animate-strip-in">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-paper text-night">
            <StepIcon name="think" />
          </span>
          <p className="rounded-2xl rounded-tl-sm bg-paper/10 px-4 py-2.5 text-sm text-paper">
            {REPLY.slice(0, typed)}
            {typed < REPLY.length && <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-taxi-pulse bg-paper align-text-bottom" />}
          </p>
        </div>
      )}

      <figcaption className="mt-4 text-xs text-paper/55">
        A real Waypoint flow: every step is a decision, a tool call, or a pause for the customer.
      </figcaption>
    </figure>
  );
}