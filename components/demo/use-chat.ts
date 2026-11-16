"use client";

import { useCallback, useState } from "react";

import type { ActionCard, ChatEvent, StepEvent } from "@/lib/chat-events";

export type CardState = "open" | "confirmed" | "cancelled" | "failed";
export type UiCard = ActionCard & { state: CardState };

export type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  cards?: UiCard[];
  ticketNumber?: string | null;
};

type Status = "idle" | "thinking";

let nextId = 0;
const newId = () => `m${++nextId}`;

/** All chat state and actions for the demo page. */
export function useChat() {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [steps, setSteps] = useState<StepEvent[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  const addMessage = (message: Omit<UiMessage, "id">) =>
    setMessages((previous) => [...previous, { ...message, id: newId() }]);

  const handleEvent = (event: ChatEvent) => {
    switch (event.type) {
      case "conversation":
        setConversationId(event.conversationId);
        break;
      case "step":
        setSteps((previous) => [...previous, event.step]);
        break;
      case "done":
        addMessage({
          role: "assistant",
          content: event.text,
          cards: event.cards.map((card) => ({ ...card, state: "open" })),
          ticketNumber: event.ticketNumber,
        });
        break;
      case "error":
        addMessage({ role: "assistant", content: event.message });
        break;
    }
  };

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || status === "thinking") return;

      addMessage({ role: "user", content: message });
      setStatus("thinking");

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, conversationId }),
        });

        if (!response.ok || !response.body) {
          const body = await response.json().catch(() => null);
          addMessage({ role: "assistant", content: body?.error ?? "Something went wrong. Please try again." });
          return;
        }

        // Read the stream line by line; each complete line is one event
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.trim()) handleEvent(JSON.parse(line) as ChatEvent);
          }
        }
      } catch {
        addMessage({ role: "assistant", content: "The connection was lost. Please try again." });
      } finally {
        setStatus("idle");
      }
    },
    [conversationId, status],
  );

  const resolveCard = useCallback(async (cardId: string, decision: "confirm" | "cancel") => {
    const setCardState = (state: CardState) =>
      setMessages((previous) =>
        previous.map((m) => ({
          ...m,
          cards: m.cards?.map((card) => (card.id === cardId ? { ...card, state } : card)),
        })),
      );

    const response = await fetch(`/api/actions/${cardId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    const result = (await response.json().catch(() => null)) as
      | { ok: boolean; message: string; step: StepEvent | null }
      | null;

    if (!result) {
      addMessage({ role: "assistant", content: "Something went wrong. Please try again." });
      return;
    }

    setCardState(result.ok ? (decision === "confirm" ? "confirmed" : "cancelled") : "failed");
    addMessage({ role: "assistant", content: result.message });
    if (result.step) setSteps((previous) => [...previous, result.step!]);
  }, []);

  const startNewConversation = useCallback(() => {
    setMessages([]);
    setSteps([]);
    setConversationId(null);
  }, []);

  return { messages, steps, status, send, resolveCard, startNewConversation };
}