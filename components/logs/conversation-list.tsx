import { OutcomeBadge } from "./outcome-badge";
import { timeAgo } from "./time";

export type ConversationSummary = {
  id: string;
  title: string;
  outcome: string;
  updatedAt: string;
  steps: number;
  tokens: number;
};

type Props = {
  conversations: ConversationSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function ConversationList({ conversations, selectedId, onSelect }: Props) {
  return (
    <ul className="divide-y divide-line">
      {conversations.map((c) => (
        <li key={c.id}>
          <button
            type="button"
            onClick={() => onSelect(c.id)}
            className={`w-full px-4 py-3 text-left hover:bg-sky ${c.id === selectedId ? "bg-sky" : "bg-paper"}`}
          >
            <span className="block truncate text-sm font-medium">{c.title}</span>
            <span className="mt-1.5 flex items-center justify-between gap-2">
              <OutcomeBadge outcome={c.outcome} />
              <span className="shrink-0 text-[11px] text-slate">{timeAgo(c.updatedAt)}</span>
            </span>
            <span className="mt-1 block font-mono text-[11px] text-slate">
              {c.steps} steps, {c.tokens.toLocaleString("en")} tokens
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}