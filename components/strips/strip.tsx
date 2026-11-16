export type StripTone = "decision" | "tool" | "result" | "waiting" | "done" | "escalation" | "error";

const TONES: Record<StripTone, { edge: string; label: string; surface: string }> = {
  decision: { edge: "bg-radar", label: "text-radar", surface: "bg-paper" },
  tool: { edge: "bg-slate", label: "text-slate", surface: "bg-paper" },
  result: { edge: "bg-line", label: "text-slate", surface: "bg-paper" },
  waiting: { edge: "bg-taxi animate-taxi-pulse", label: "text-ink", surface: "bg-taxi-soft" },
  done: { edge: "bg-go", label: "text-go", surface: "bg-paper" },
  escalation: { edge: "bg-ink", label: "text-ink", surface: "bg-paper" },
  error: { edge: "bg-stop", label: "text-stop", surface: "bg-paper" },
};

type StripProps = {
  tone: StripTone;
  label: string;
  title: string;
  detail?: string;
  meta?: string;
};

export function Strip({ tone, label, title, detail, meta }: StripProps) {
  const style = TONES[tone];

  return (
    <div className={`flex overflow-hidden rounded-md border border-line ${style.surface}`}>
      <div className={`w-1.5 shrink-0 ${style.edge}`} />
      <div className="min-w-0 flex-1 px-3 py-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className={`text-xs font-medium ${style.label}`}>{label}</span>
          {meta && <span className="shrink-0 font-mono text-xs text-slate">{meta}</span>}
        </div>
        <p className="text-sm text-ink">{title}</p>
        {detail && <p className="mt-0.5 truncate font-mono text-xs text-slate">{detail}</p>}
      </div>
    </div>
  );
}