"use client";

import { useEffect, useRef } from "react";

import { Strip } from "@/components/strips";
import type { StepEvent } from "@/lib/chat-events";

import { buildTrace } from "./step-to-strip";

type Props = {
  steps: StepEvent[];
  working: boolean;
};

export function TracePanel({ steps, working }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll only this panel to its newest strip
  useEffect(() => {
    const panel = scrollRef.current;
    if (panel) panel.scrollTo({ top: panel.scrollHeight, behavior: "smooth" });
  }, [steps.length, working]);

  const turns = [...new Set(steps.map((s) => s.turn))];

  return (
    <aside className="flex h-full min-h-0 flex-col bg-night text-paper">
      <div className="flex items-baseline justify-between border-b border-paper/10 px-4 py-3">
        <h2 className="font-display text-lg font-semibold">Live trace</h2>
        <span className="font-mono text-[11px] text-paper/50">{steps.length} steps logged</span>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-3">
        {steps.length === 0 && !working && (
          <p className="text-sm text-paper/55">
            Each step Waypoint takes appears here as it happens: its decisions, the tools it uses, and when it waits
            for you.
          </p>
        )}

        {turns.map((turn) => (
          <section key={turn} aria-label={`Message ${turn}`}>
            <h3 className="mb-1.5 text-[11px] text-paper/45">Message {turn}</h3>
            <ol className="space-y-1.5">
              {buildTrace(steps.filter((s) => s.turn === turn)).map(({ key, strip }) => (
                <li key={key} className="animate-strip-in">
                  <Strip {...strip} compact />
                </li>
              ))}
            </ol>
          </section>
        ))}

        {working && (
          <p className="flex items-center gap-2 text-xs text-paper/70">
            <span className="h-2 w-2 animate-taxi-pulse rounded-full bg-taxi" />
            Waypoint is working
          </p>
        )}
      </div>
    </aside>
  );
}