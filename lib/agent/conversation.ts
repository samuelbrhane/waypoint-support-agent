import { and, asc, count, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  type ConversationOutcome,
  type MessageRole,
  conversations,
  messages,
} from "@/lib/db/schema";

const TITLE_LENGTH = 50;

export type ChatMessage = { role: MessageRole; content: string };

function makeTitle(text: string): string {
  const title = text.replace(/\s+/g, " ").trim();
  return title.length <= TITLE_LENGTH ? title : `${title.slice(0, TITLE_LENGTH - 1).trimEnd()}…`;
}

/** Start a conversation, titled with the customer's first message. */
export async function createConversation(visitorId: string, firstMessage: string): Promise<string> {
  const [row] = await db
    .insert(conversations)
    .values({ visitorId, title: makeTitle(firstMessage) })
    .returning({ id: conversations.id });
  return row.id;
}

/** Load a conversation only if it belongs to this visitor. */
export async function getConversation(conversationId: string, visitorId: string) {
  const [row] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.visitorId, visitorId)))
    .limit(1);
  return row ?? null;
}

/** The chat so far, oldest first, for the model. */
export async function loadHistory(conversationId: string): Promise<ChatMessage[]> {
  return db
    .select({ role: messages.role, content: messages.content })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.id));
}

/** Save a message and mark the conversation as recently active. */
export async function addMessage(conversationId: string, role: MessageRole, content: string): Promise<void> {
  await db.insert(messages).values({ conversationId, role, content });
  await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conversationId));
}

/** The turn number for the newest customer message: 1 for the first, 2 for the second, and so on. */
export async function currentTurn(conversationId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(messages)
    .where(and(eq(messages.conversationId, conversationId), eq(messages.role, "user")));
  return row.n;
}

/** Record how the conversation ended, for the Logs page. */
export async function setOutcome(conversationId: string, outcome: ConversationOutcome): Promise<void> {
  await db.update(conversations).set({ outcome }).where(eq(conversations.id, conversationId));
}