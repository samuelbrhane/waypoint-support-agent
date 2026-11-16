import type { StepEvent } from "@/lib/chat-events";

import { OutcomeBadge } from "./outcome-badge";
import { StepRow } from "./step-row";
import { timeAgo } from "./time";

export type ConversationDetailData = {
  conversation: { id: string; title: string; outcome: string; createdAt: string };
  messages: { id: number; role: "user" | "assistant"; content: string }[];
  steps: StepEvent[];
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-slate">{label}</dt>
      <dd className="font-mono text-sm">{value}</dd>
    </div>
  );
}

export function ConversationDetail({ data }: { data: ConversationDetailData }) {
  const { conversation, messages, steps } = data;

  const tokens = steps.reduce((sum, s) => sum + (s.inputTokens ?? 0) + (s.outputTokens ?? 0), 0);
  const modelMs = steps.filter((s) => s.type === "model_call").reduce((sum, s) => sum + (s.durationMs ?? 0), 0);
  const toolCalls = steps.filter((s) => s.type === "tool_call").length;
  const errors = steps.filter((s) => s.error).length;
  const turns = [...new Set(steps.map((s) => s.turn))];

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-2xl font-bold tracking-tight">{conversation.title}</h2>
          <OutcomeBadge outcome={conversation.outcome} />
        </div>
        <p className="text-xs text-slate">Started {timeAgo(conversation.createdAt)}</p>
        <dl className="grid grid-cols-2 gap-4 rounded-lg border border-line bg-paper p-4 sm:grid-cols-5">
          <Stat label="Steps" value={String(steps.length)} />
          <Stat label="Tool calls" value={String(toolCalls)} />
          <Stat label="Errors and retries" value={String(errors)} />
          <Stat label="Tokens" value={tokens.toLocaleString("en")} />
          <Stat label="Model time" value={`${(modelMs / 1000).toFixed(1)} s`} />
        </dl>
      </header>

      <section>
        <h3 className="mb-3 font-display text-lg font-semibold">Conversation</h3>
        <ol className="space-y-2">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                m.role === "user" ? "ml-auto w-fit max-w-[80%] bg-ink text-paper" : "max-w-[90%] bg-paper"
              }`}
            >
              {m.content}
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h3 className="mb-3 font-display text-lg font-semibold">Trace</h3>
        <div className="space-y-6">
          {turns.map((turn) => (
            <div key={turn}>
              <p className="mb-2 text-xs font-medium text-slate">Message {turn}</p>
              <ol className="space-y-2">
                {steps
                  .filter((s) => s.turn === turn)
                  .map((step) => (
                    <StepRow key={step.id} step={step} />
                  ))}
              </ol>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}