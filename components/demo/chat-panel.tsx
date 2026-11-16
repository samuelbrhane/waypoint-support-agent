"use client";

import { useEffect, useRef } from "react";

import { LogoMark } from "@/components/brand";

import { ChatInput } from "./chat-input";
import { MessageBubble } from "./message-bubble";
import type { UiMessage } from "./use-chat";
import { Welcome } from "./welcome";

type Props = {
  messages: UiMessage[];
  working: boolean;
  onSend: (text: string) => void;
  onResolve: (cardId: string, decision: "confirm" | "cancel") => Promise<void>;
  onReset: () => void;
  refreshKey: number;
};

export function ChatPanel({ messages, working, onSend, onResolve, onReset, refreshKey }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, working]);

  return (
    <section className="flex min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
        <div className="mx-auto max-w-2xl space-y-5">
          {messages.length === 0 ? (
            <Welcome onAsk={onSend} onReset={onReset} refreshKey={refreshKey} />
          ) : (
            messages.map((message) => <MessageBubble key={message.id} message={message} onResolve={onResolve} />)
          )}

          {working && (
            <div className="flex items-center gap-3 text-sm text-slate">
              <span className="animate-taxi-pulse text-ink">
                <LogoMark size={22} />
              </span>
              Checking with Velmora Air…
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="border-t border-line bg-sky px-5 py-4 sm:px-8">
        <div className="mx-auto max-w-2xl">
          <ChatInput disabled={working} onSend={onSend} />
        </div>
      </div>
    </section>
  );
}