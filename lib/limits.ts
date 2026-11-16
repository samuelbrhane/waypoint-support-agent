import { and, count, eq, gt } from "drizzle-orm";

import { db } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Count customer messages in the last 24 hours, for one visitor or for everyone. */
async function messagesToday(visitorId?: string): Promise<number> {
  const since = new Date(Date.now() - DAY_MS);
  const conditions = [eq(messages.role, "user"), gt(messages.createdAt, since)];
  if (visitorId) conditions.push(eq(conversations.visitorId, visitorId));

  const [row] = await db
    .select({ n: count() })
    .from(messages)
    .innerJoin(conversations, eq(conversations.id, messages.conversationId))
    .where(and(...conditions));

  return row.n;
}

/** Returns a message for the customer if a daily limit is reached in demo mode, otherwise null. */
export async function checkMessageLimit(visitorId: string): Promise<string | null> {
  if (process.env.DEMO_MODE !== "true") {
    return null;
  }

  const perVisitor = Number(process.env.DAILY_MESSAGES_PER_VISITOR ?? 20);
  const total = Number(process.env.DAILY_MESSAGES_TOTAL ?? 300);

  if ((await messagesToday(visitorId)) >= perVisitor) {
    return `You've reached the limit of ${perVisitor} messages per day. Please come back tomorrow.`;
  }

  if ((await messagesToday()) >= total) {
    return "Waypoint has reached its daily message limit. Please come back tomorrow.";
  }

  return null;
}