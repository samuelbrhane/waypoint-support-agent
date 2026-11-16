import Link from "next/link";

const ROWS = [
  { title: "Can I move my flight VM4821 to a later date?", outcome: "Resolved", tone: "text-go", steps: 11, tokens: "3,412" },
  { title: "I missed my connection on booking VM6012", outcome: "Handed to a person", tone: "text-ink", steps: 8, tokens: "2,276" },
  { title: "My flight VM3307 was cancelled, I want my money back", outcome: "Waiting for confirmation", tone: "text-ink", steps: 12, tokens: "3,905" },
  { title: "Where is my booking?", outcome: "Asked for details", tone: "text-slate", steps: 2, tokens: "1,034" },
];

export function LogsPreview() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1fr_1.2fr]">
      <div className="max-w-md">
        <h2 className="font-display text-4xl font-bold tracking-tight">Every decision is visible</h2>
        <p className="mt-4 leading-relaxed text-slate">
          Each conversation is logged step by step: what the agent decided, which tools it called, what came back, how
          long it took and what it cost. When something goes wrong, your team can replay exactly what happened.
        </p>
        <Link href="/logs" className="mt-6 inline-block font-medium underline decoration-line underline-offset-4 hover:decoration-ink">
          Open the logs
        </Link>
      </div>

      <div className="reveal overflow-hidden rounded-xl border border-line bg-paper">
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-line px-4 py-2.5 text-xs text-slate">
          <span>Conversation</span>
          <span className="w-16 text-right">Steps</span>
          <span className="w-16 text-right">Tokens</span>
        </div>
        <ul>
          {ROWS.map((row) => (
            <li key={row.title} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-line px-4 py-3 last:border-0">
              <span className="min-w-0">
                <span className="block truncate text-sm">{row.title}</span>
                <span className={`text-xs font-medium ${row.tone}`}>{row.outcome}</span>
              </span>
              <span className="w-16 text-right font-mono text-sm text-slate">{row.steps}</span>
              <span className="w-16 text-right font-mono text-sm text-slate">{row.tokens}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}