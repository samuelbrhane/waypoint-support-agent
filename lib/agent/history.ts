import { and, asc, count, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { agentSteps, conversations, messages, pendingActions } from "@/lib/db/schema";

import { getConversation } from "./conversation";

/** This visitor's conversations with step counts and token use, newest first. */
export async function listConversations(visitorId: string) {
  return db
    .select({
      id: conversations.id,
      title: conversations.title,
      outcome: conversations.outcome,
      updatedAt: conversations.updatedAt,
      steps: count(agentSteps.id),
      tokens: sql<number>`coalesce(sum(${agentSteps.inputTokens} + ${agentSteps.outputTokens}), 0)`.mapWith(Number),
    })
    .from(conversations)
    .leftJoin(agentSteps, eq(agentSteps.conversationId, conversations.id))
    .where(eq(conversations.visitorId, visitorId))
    .groupBy(conversations.id)
    .orderBy(desc(conversations.updatedAt))
    .limit(50);
}

/** Everything needed to show or replay one conversation. */
export async function getConversationDetail(conversationId: string, visitorId: string) {
  const conversation = await getConversation(conversationId, visitorId);
  if (!conversation) {
    return null;
  }

  const [chat, steps, cards] = await Promise.all([
    db
      .select({ id: messages.id, role: messages.role, content: messages.content, createdAt: messages.createdAt })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.id)),
    db
      .select()
      .from(agentSteps)
      .where(eq(agentSteps.conversationId, conversationId))
      .orderBy(asc(agentSteps.turn), asc(agentSteps.position)),
    db
      .select({
        id: pendingActions.id,
        action: pendingActions.action,
        bookingRef: pendingActions.bookingRef,
        summary: pendingActions.summary,
      })
      .from(pendingActions)
      .where(and(eq(pendingActions.conversationId, conversationId), eq(pendingActions.status, "pending"))),
  ]);

  return { conversation, messages: chat, steps, cards };
}