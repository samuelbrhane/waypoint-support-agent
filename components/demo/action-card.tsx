"use client";

import { useState } from "react";

import type { UiCard } from "./use-chat";

const RESOLVED: Record<Exclude<UiCard["state"], "open">, { text: string; style: string }> = {
  confirmed: { text: "Confirmed", style: "border-go text-go" },
  cancelled: { text: "Cancelled", style: "border-line text-slate" },
  failed: { text: "Could not be completed", style: "border-stop text-stop" },
};

type Props = {
  card: UiCard;
  onResolve: (cardId: string, decision: "confirm" | "cancel") => Promise<void>;
};

export function ActionCard({ card, onResolve }: Props) {
  const [busy, setBusy] = useState(false);

  const decide = async (decision: "confirm" | "cancel") => {
    setBusy(true);
    await onResolve(card.id, decision);
    setBusy(false);
  };

  if (card.state !== "open") {
    const resolved = RESOLVED[card.state];
    return (
      <div className={`rounded-md border-l-4 bg-paper px-4 py-3 text-sm ${resolved.style}`}>
        <span className="font-medium">{resolved.text}.</span> <span className="text-slate">{card.summary}</span>
      </div>
    );
  }

  return (
    <div className="animate-taxi-glow rounded-lg border border-taxi bg-taxi-soft p-4">
      <p className="text-xs font-medium text-ink/70">
        {card.action === "rebook" ? "Change booking" : "Refund booking"}{" "}
        <span className="font-mono">{card.bookingRef}</span>
      </p>
      <p className="mt-1 text-sm font-medium text-ink">{card.summary}</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => decide("confirm")}
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink/90 disabled:opacity-50"
        >
          {busy ? "Working…" : "Confirm"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => decide("cancel")}
          className="rounded-md border border-ink/20 px-4 py-2 text-sm font-medium text-ink hover:bg-paper disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}