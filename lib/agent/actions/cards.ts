import { and, eq, inArray } from "drizzle-orm";

import type { ActionCard } from "@/lib/chat-events";
import { db } from "@/lib/db";
import { pendingActions } from "@/lib/db/schema";

/** Load the cards that are still waiting for the customer. */
export async function getOpenCards(actionIds: string[]): Promise<ActionCard[]> {
  if (actionIds.length === 0) {
    return [];
  }

  return db
    .select({
      id: pendingActions.id,
      action: pendingActions.action,
      bookingRef: pendingActions.bookingRef,
      summary: pendingActions.summary,
    })
    .from(pendingActions)
    .where(and(inArray(pendingActions.id, actionIds), eq(pendingActions.status, "pending")));
}