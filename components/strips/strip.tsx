export type StripTone = "decision" | "tool" | "result" | "waiting" | "done" | "escalation" | "error";

const TONES: Record<StripTone, { edge: string; label: string; surface: string }> = {
  decision: { edge: "bg-radar", label: "text-radar", surface: "bg-paper" },
  tool: { edge: "bg-slate", label: "text-slate", surface: "bg-paper" },
  result: { edge: "bg-line", label: "text-slate", surface: "bg-paper" },
  waiting: { edge: "bg-taxi animate-taxi-pulse", label: "text-ink", surface: "bg-taxi-soft animate-taxi-glow" },
  done: { edge: "bg-go", label: "text-go", surface: "bg-paper" },
  escalation: { edge: "bg-ink", label: "text-ink", surface: "bg-paper" },
  error: { edge: "bg-stop", label: "text-stop", surface: "bg-paper" },
};

export type StripProps = {
  tone: StripTone;
  label: string;
  title: string;
  detail?: string;
  meta?: string;
  compact?: boolean;
};

export function Strip({ tone, label, title, detail, meta, compact = false }: StripProps) {
  const style = TONES[tone];

  return (
    <div className={`flex overflow-hidden rounded-md border border-line ${style.surface}`}>
      <div className={`shrink-0 ${compact ? "w-1" : "w-1.5"} ${style.edge}`} />
      <div className={`min-w-0 flex-1 ${compact ? "px-2.5 py-1.5" : "px-3 py-2"}`}>
        <div className="flex items-baseline justify-between gap-3">
          <span className={`truncate font-medium ${compact ? "text-[11px]" : "text-xs"} ${style.label}`}>{label}</span>
          {meta && <span className="shrink-0 font-mono text-[11px] text-slate">{meta}</span>}
        </div>
        <p className={compact ? "line-clamp-2 text-[13px] leading-snug text-ink" : "text-sm text-ink"}>{title}</p>
        {detail && !compact && <p className="mt-0.5 truncate font-mono text-xs text-slate">{detail}</p>}
      </div>
    </div>
  );
}