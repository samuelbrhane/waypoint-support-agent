const OUTCOMES: Record<string, { label: string; style: string }> = {
  resolved: { label: "Resolved", style: "bg-go/10 text-go" },
  open: { label: "Waiting for confirmation", style: "bg-taxi-soft text-ink" },
  clarification: { label: "Asked for details", style: "bg-radar/10 text-radar" },
  escalated: { label: "Handed to a person", style: "bg-ink text-paper" },
};

export function OutcomeBadge({ outcome }: { outcome: string }) {
  const { label, style } = OUTCOMES[outcome] ?? { label: outcome, style: "bg-line text-slate" };
  return <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-medium ${style}`}>{label}</span>;
}