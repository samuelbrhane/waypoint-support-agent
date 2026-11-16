"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand";

import { ConversationDetail, type ConversationDetailData } from "./conversation-detail";
import { ConversationList, type ConversationSummary } from "./conversation-list";

export function LogsApp() {
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetailData | null>(null);

  // Load the list, and open the conversation named in the URL if there is one
  useEffect(() => {
    fetch("/api/conversations")
      .then((response) => response.json())
      .then((data: { conversations: ConversationSummary[] }) => {
        setConversations(data.conversations);
        const fromUrl = new URLSearchParams(window.location.search).get("c");
        setSelectedId(fromUrl ?? data.conversations[0]?.id ?? null);
      })
      .catch(() => setConversations([]));
  }, []);

  // Load the selected conversation and keep its ID in the URL, so the link can be shared
  useEffect(() => {
    if (!selectedId) return;
    setDetail(null);
    window.history.replaceState(null, "", `/logs?c=${selectedId}`);
    fetch(`/api/conversations/${selectedId}`)
      .then((response) => (response.ok ? response.json() : null))
      .then(setDetail)
      .catch(() => setDetail(null));
  }, [selectedId]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex items-center justify-between bg-night px-5 py-3 text-paper">
        <Link href="/" aria-label="Waypoint home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <span className="font-medium">Logs</span>
          <Link href="/demo" className="rounded-md bg-taxi px-3 py-1.5 font-medium text-ink hover:bg-taxi/90">
            Try Waypoint
          </Link>
        </nav>
      </header>

      <main className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[340px_1fr]">
        <aside
          className={`min-h-0 overflow-y-auto border-r border-line bg-paper ${selectedId ? "hidden lg:block" : ""}`}
        >
          <h1 className="border-b border-line px-4 py-3 font-display text-xl font-bold">Conversations</h1>
          {conversations === null && <p className="p-4 text-sm text-slate">Loading…</p>}
          {conversations?.length === 0 && (
            <p className="p-4 text-sm text-slate">
              No conversations yet.{" "}
              <Link href="/demo" className="font-medium text-ink underline underline-offset-4">
                Ask Waypoint something
              </Link>{" "}
              and it will appear here.
            </p>
          )}
          {conversations && conversations.length > 0 && (
            <ConversationList conversations={conversations} selectedId={selectedId} onSelect={setSelectedId} />
          )}
        </aside>

        <section className={`min-h-0 overflow-y-auto px-5 py-6 sm:px-8 ${selectedId ? "" : "hidden lg:block"}`}>
          {selectedId && (
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="mb-4 text-sm text-slate hover:text-ink lg:hidden"
            >
              ← All conversations
            </button>
          )}
          <div className="mx-auto max-w-3xl">
            {detail ? (
              <ConversationDetail data={detail} />
            ) : (
              selectedId && <p className="text-sm text-slate">Loading the trace…</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}