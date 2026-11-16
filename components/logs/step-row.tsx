import { Strip } from "@/components/strips";
import type { StepEvent } from "@/lib/chat-events";

import { stepToStrip } from "@/components/demo/step-to-strip";
import { clockTime } from "./time";

function Json({ label, value }: { label: string; value: unknown }) {
  if (value == null) return null;
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium text-slate">{label}</p>
      <pre className="overflow-x-auto rounded bg-sky p-2 font-mono text-[11px] leading-relaxed text-ink">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

export function StepRow({ step }: { step: StepEvent }) {
  const hasDetails = step.input != null || step.output != null || step.error != null;

  return (
    <li className="space-y-1">
      <div className="flex items-baseline gap-3">
        <span className="w-14 shrink-0 font-mono text-[11px] text-slate">{clockTime(step.createdAt)}</span>
        <div className="min-w-0 flex-1">
          <Strip {...stepToStrip(step)} />
        </div>
      </div>
      {hasDetails && (
        <details className="ml-[4.25rem] text-sm">
          <summary className="cursor-pointer text-[11px] text-slate hover:text-ink">
            Details
            {step.inputTokens != null && ` · ${step.inputTokens} in, ${step.outputTokens} out tokens`}
          </summary>
          <div className="mt-2 space-y-2">
            <Json label="Input" value={step.input} />
            <Json label="Output" value={step.output} />
            {step.error && <Json label="Error" value={step.error} />}
          </div>
        </details>
      )}
    </li>
  );
}