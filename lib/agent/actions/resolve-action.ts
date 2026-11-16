import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { pendingActions } from "@/lib/db/schema";

import { addMessage, currentTurn, setOutcome } from "../conversation";
import { type LoggedStep, StepLogger, lastPosition } from "../logger";
import { applyAction } from "./apply-action";

export type Decision = "confirm" | "cancel";

type ResolveOptions = {
  actionId: string;
  visitorId: string;
  decision: Decision;
  onStep?: (step: LoggedStep) => void;
};

/** Handle the customer's click on Confirm or Cancel. */
export async function resolveAction({ actionId, visitorId, decision, onStep }: ResolveOptions) {
  // Claim the card so a double click cannot run it twice
  const action = await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(pendingActions)
      .where(
        and(
          eq(pendingActions.id, actionId),
          eq(pendingActions.visitorId, visitorId),
          eq(pendingActions.status, "pending"),
        ),
      )
      .for("update");

    if (!row) {
      return null;
    }

    await tx
      .update(pendingActions)
      .set({ status: decision === "confirm" ? "confirmed" : "cancelled", resolvedAt: new Date() })
      .where(eq(pendingActions.id, row.id));

    return row;
  });

  if (!action) {
    return { ok: false, message: "This card has already been used or is no longer valid." };
  }

  let result = { ok: true, message: "No problem, I've cancelled that. Your booking stays as it was." };

  if (decision === "confirm") {
    result = await applyAction(action);
    if (!result.ok) {
      await db.update(pendingActions).set({ status: "failed" }).where(eq(pendingActions.id, action.id));
    }
  }

  const turn = await currentTurn(action.conversationId);
  const start = await lastPosition(action.conversationId, turn);
  const logger = new StepLogger(action.conversationId, turn, onStep, start);

  await logger.log({
    type: "confirmation_resolved",
    toolName: action.action === "rebook" ? "request_rebooking" : "request_refund",
    input: { action_id: action.id, decision },
    output: { ok: result.ok, message: result.message },
    error: result.ok ? null : result.message,
  });

  await addMessage(action.conversationId, "assistant", result.message);
  await setOutcome(action.conversationId, result.ok ? "resolved" : "open");

  return { ...result, conversationId: action.conversationId };
}