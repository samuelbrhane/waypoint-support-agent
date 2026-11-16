import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { type ActionType, pendingActions } from "@/lib/db/schema";

import type { ToolContext, ToolResult } from "./types";

/** Save an action that waits for the customer's confirmation. */
export async function createPendingAction(
  context: ToolContext,
  bookingRef: string,
  action: ActionType,
  params: Record<string, unknown>,
  summary: string,
): Promise<ToolResult> {
  const [row] = await db.transaction(async (tx) => {
    // Only one open card per booking: replace any earlier one
    await tx
      .update(pendingActions)
      .set({ status: "cancelled", resolvedAt: new Date() })
      .where(
        and(
          eq(pendingActions.visitorId, context.visitorId),
          eq(pendingActions.bookingRef, bookingRef),
          eq(pendingActions.status, "pending"),
        ),
      );

    return tx
      .insert(pendingActions)
      .values({
        conversationId: context.conversationId,
        visitorId: context.visitorId,
        bookingRef,
        action,
        params,
        summary,
      })
      .returning({ id: pendingActions.id });
  });

  return {
    ok: true,
    data: {
      status: "awaiting_confirmation",
      action_id: row.id,
      summary,
      instruction:
        "Tell the customer what will happen and ask them to confirm with the Confirm button. " +
        "Do not say the change is done.",
    },
  };
}