"use client";

import Link from "next/link";
import { useState } from "react";

import { Logo } from "@/components/brand";

import { ChatPanel } from "./chat-panel";
import { TracePanel } from "./trace-panel";
import { useChat } from "./use-chat";

export function DemoApp() {
  const chat = useChat();
  const [refreshKey, setRefreshKey] = useState(0);
  const working = chat.status === "thinking";

  const newChat = () => {
    chat.startNewConversation();
    setRefreshKey((key) => key + 1);
  };

  const resetDemo = async () => {
    await fetch("/api/demo/reset", { method: "POST" });
    newChat();
  };

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between bg-night px-5 py-3 text-paper">
        <Link href="/" aria-label="Waypoint home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/logs" className="text-paper/70 hover:text-paper">
            Logs
          </Link>
          <button
            type="button"
            onClick={newChat}
            disabled={working}
            className="rounded-md border border-paper/25 px-3 py-1.5 font-medium hover:border-paper/60 disabled:opacity-40"
          >
            New chat
          </button>
        </nav>
      </header>

      <main className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[1fr_minmax(360px,440px)]">
        <ChatPanel
          messages={chat.messages}
          working={working}
          onSend={chat.send}
          onResolve={chat.resolveCard}
          onReset={resetDemo}
          refreshKey={refreshKey}
        />
        <div className="h-[42dvh] min-h-0 border-t border-line lg:h-auto lg:border-t-0">
          <TracePanel steps={chat.steps} working={working} />
        </div>
      </main>
    </div>
  );
}