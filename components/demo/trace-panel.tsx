"use client";

import { useEffect, useRef } from "react";

import { StepIcon, Strip, type StripTone } from "@/components/strips";
import type { StepEvent } from "@/lib/chat-events";

import { buildTrace } from "./step-to-strip";

const NODE: Record<StripTone, string> = {
  decision: "bg-radar text-paper",
  tool: "bg-glow text-night",
  result: "bg-paper/60 text-night",
  waiting: "bg-taxi text-night",
  done: "bg-go text-paper",
  escalation: "bg-paper text-night",
  error: "bg-stop text-paper",
};

type Props = {
  steps: StepEvent[];
  questions: string[];
  working: boolean;
};

/** What the agent is doing right now, from its latest step. */
function currentActivity(steps: StepEvent[]): string {
  const last = steps.at(-1);
  if (!last) return "Reading the message";

  const output = (last.output ?? {}) as { decision?: string; tools?: string[] };
  if (last.type === "model_call" && output.decision === "use_tools") return `Running ${output.tools?.[0]}`;
  if (last.type === "tool_call") return `Running ${last.toolName}`;
  if (last.type === "retry") return `Retrying ${last.toolName ?? "the step"}`;
  if (last.type === "tool_result" || last.type === "tool_error") return "Deciding the next step";
  if (last.type === "confirmation_requested") return "Writing the reply";
  return "Writing the reply";
}

export function TracePanel({ steps, questions, working }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll only this panel to its newest step
  useEffect(() => {
    const panel = scrollRef.current;
    if (panel) panel.scrollTo({ top: panel.scrollHeight, behavior: "smooth" });
  }, [steps.length, working]);

  const turns = [...new Set(steps.map((s) => s.turn))];
  const lastTurn = turns.at(-1);
  const waitingForFirstStep = working && (turns.length === 0 || questions.length > (lastTurn ?? 0));

  return (
    <aside className="flex h-full min-h-0 flex-col bg-night text-paper">
      <div className="flex items-center justify-between border-b border-paper/10 px-4 py-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <span className={`h-2 w-2 rounded-full ${working ? "animate-taxi-pulse bg-taxi" : "bg-go"}`} />
          Live trace
        </h2>
        <span className="font-mono text-[11px] text-paper/50">{steps.length} steps logged</span>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
        {steps.length === 0 && !working && (
          <p className="text-sm text-paper/55">
            Each step Waypoint takes appears here as it happens: its thinking, the tools it uses, and when it waits
            for you.
          </p>
        )}

        {turns.map((turn) => {
          const items = buildTrace(steps.filter((s) => s.turn === turn));
          const isLiveTurn = working && !waitingForFirstStep && turn === lastTurn;

          return (
            <section key={turn} aria-label={`Message ${turn}`}>
              <p className="mb-3 truncate rounded-md bg-paper/5 px-3 py-2 text-xs text-paper/75">
                <span className="text-paper/45">You: </span>
                {questions[turn - 1] ?? `Message ${turn}`}
              </p>

              <ol>
                {items.map(({ key, strip, icon }, index) => {
                  const isLast = index === items.length - 1;

                  return (
                    <li key={key} className="relative animate-strip-in pb-2 pl-9">
                      {(!isLast || isLiveTurn) && (
                        <span className="absolute left-[11px] top-6 h-full w-px origin-top animate-line-grow bg-glow/40" />
                      )}
                      <span
                        className={`absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-night ${NODE[strip.tone]}`}
                      >
                        <StepIcon name={icon} />
                      </span>
                      <Strip {...strip} compact />
                    </li>
                  );
                })}

                {isLiveTurn && <PendingRow text={currentActivity(steps)} />}
              </ol>
            </section>
          );
        })}

        {waitingForFirstStep && (
          <section aria-label="New message">
            <p className="mb-3 truncate rounded-md bg-paper/5 px-3 py-2 text-xs text-paper/75">
              <span className="text-paper/45">You: </span>
              {questions.at(-1)}
            </p>
            <ol>
              <PendingRow text="Reading the message" />
            </ol>
          </section>
        )}
      </div>
    </aside>
  );
}

function PendingRow({ text }: { text: string }) {
  return (
    <li className="relative animate-strip-in pl-9">
      <span className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center">
        <span className="absolute h-full w-full animate-ping rounded-full bg-taxi opacity-60" />
        <span className="relative h-3 w-3 rounded-full bg-taxi ring-4 ring-night" />
      </span>
      <p className="pt-1 font-mono text-xs text-taxi">{text}…</p>
    </li>
  );
}