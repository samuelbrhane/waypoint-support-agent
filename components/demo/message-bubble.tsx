import { LogoMark } from "@/components/brand";

import { ActionCard } from "./action-card";
import { formatAnswer } from "./format-answer";
import type { UiMessage } from "./use-chat";

type Props = {
  message: UiMessage;
  onResolve: (cardId: string, decision: "confirm" | "cancel") => Promise<void>;
};

export function MessageBubble({ message, onResolve }: Props) {
  if (message.role === "user") {
    return (
      <div className="ml-auto w-fit max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-ink px-4 py-2.5 text-sm text-paper">
        {message.content}
      </div>
    );
  }

  return (
    <div className="flex max-w-[90%] gap-3">
      <span className="mt-0.5 shrink-0 text-ink">
        <LogoMark size={22} />
      </span>
      <div className="min-w-0 space-y-3">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{formatAnswer(message.content)}</p>
        {message.cards?.map((card) => (
          <ActionCard key={card.id} card={card} onResolve={onResolve} />
        ))}
        {message.ticketNumber && (
          <p className="w-fit rounded-md border-l-4 border-ink bg-paper px-3 py-2 text-sm">
            Ticket <span className="font-mono">{message.ticketNumber}</span> is with our support team.
          </p>
        )}
      </div>
    </div>
  );
}