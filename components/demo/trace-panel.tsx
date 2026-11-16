"use client";

import { useEffect, useRef } from "react";

import { Strip } from "@/components/strips";
import type { StepEvent } from "@/lib/chat-events";

import { stepToStrip } from "./step-to-strip";

type Props = {
  steps: StepEvent[];
  working: boolean;
};

export function TracePanel({ steps, working }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [steps.length, working]);

  const turns = [...new Set(steps.map((s) => s.turn))];

  return (
    <aside className="flex min-h-0 flex-col bg-night text-paper">
      <div className="flex items-baseline justify-between border-b border-paper/10 px-5 py-4">
        <h2 className="font-display text-xl font-semibold">Live trace</h2>
        <span className="font-mono text-xs text-paper/50">{steps.length} steps</span>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
        {steps.length === 0 && !working && (
          <p className="text-sm text-paper/55">
            Each step Waypoint takes appears here as it happens: its decisions, the tools it calls, what they return,
            and when it waits for you.
          </p>
        )}

        {turns.map((turn) => (
          <section key={turn} aria-label={`Message ${turn}`}>
            <h3 className="mb-2 text-xs text-paper/45">Message {turn}</h3>
            <ol className="space-y-2">
              {steps
                .filter((s) => s.turn === turn)
                .map((step) => (
                  <li key={step.id} className="animate-strip-in">
                    <Strip {...stepToStrip(step)} />
                  </li>
                ))}
            </ol>
          </section>
        ))}

        {working && (
          <p className="flex items-center gap-2 text-sm text-paper/70">
            <span className="h-2 w-2 animate-taxi-pulse rounded-full bg-taxi" />
            Waypoint is working
          </p>
        )}
        <div ref={endRef} />
      </div>
    </aside>
  );
}