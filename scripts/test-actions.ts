// Tests confirming and cancelling cards, double clicks, and the booking changes
import "./load-env";

import { asc, eq } from "drizzle-orm";

import { resolveAction } from "@/lib/agent/actions";
import { findBooking } from "@/lib/agent/booking-data";
import { addMessage, createConversation, loadHistory } from "@/lib/agent/conversation";
import { runTool, toolsByName } from "@/lib/agent/tools";
import { db } from "@/lib/db";
import { agentSteps, bookings, conversations, flights, tickets } from "@/lib/db/schema";
import { ensureVisitorData } from "@/lib/demo";

const VISITOR = "test-actions-visitor";

async function main() {
  await ensureVisitorData(VISITOR);
  const conversationId = await createConversation(VISITOR, "Action test");
  await addMessage(conversationId, "user", "Action test");
  const context = { visitorId: VISITOR, conversationId };

  async function card(tool: string, args: object): Promise<string> {
    const result = await runTool(toolsByName.get(tool)!, JSON.stringify(args), context);
    if (!result.ok) throw new Error(result.error);
    return (result.data as { action_id: string }).action_id;
  }

  async function bookingState(ref: string) {
    const found = await findBooking(VISITOR, ref);
    return `${ref}: ${found!.booking.status}, on ${found!.segments.map((s) => s.flightNumber).join(" + ")}`;
  }

  // 1. Confirm a rebooking, then click Confirm again
  const rebook = await card("request_rebooking", { booking_ref: "VM4821", new_flight_number: "VM217" });
  console.log("Confirm rebooking:", await resolveAction({ actionId: rebook, visitorId: VISITOR, decision: "confirm" }));
  console.log("Confirm again:   ", await resolveAction({ actionId: rebook, visitorId: VISITOR, decision: "confirm" }));
  console.log("  ", await bookingState("VM4821"));

  // 2. Confirm a refund
  const refund = await card("request_refund", { booking_ref: "VM3307" });
  console.log("\nConfirm refund:", await resolveAction({ actionId: refund, visitorId: VISITOR, decision: "confirm" }));
  console.log("  ", await bookingState("VM3307"));

  // 3. Cancel a rebooking
  const cancelled = await card("request_rebooking", { booking_ref: "VM5190", new_flight_number: "VM120" });
  console.log("\nCancel rebooking:", await resolveAction({ actionId: cancelled, visitorId: VISITOR, decision: "cancel" }));
  console.log("  ", await bookingState("VM5190"));

  // 4. Double click: two confirms at the same moment
  const double = await card("request_rebooking", { booking_ref: "VM2654", new_flight_number: "VM332" });
  const results = await Promise.all([
    resolveAction({ actionId: double, visitorId: VISITOR, decision: "confirm" }),
    resolveAction({ actionId: double, visitorId: VISITOR, decision: "confirm" }),
  ]);
  console.log("\nDouble click:", results.map((r) => (r.ok ? "applied" : r.message)));
  console.log("  ", await bookingState("VM2654"));

  // 5. Another visitor cannot confirm this visitor's card
  const foreign = await card("request_refund", { booking_ref: "VM7745" });
  console.log("\nOther visitor:", await resolveAction({ actionId: foreign, visitorId: "someone-else", decision: "confirm" }));

  // The trace and chat for the conversation
  const steps = await db
    .select({ type: agentSteps.type, tool: agentSteps.toolName, position: agentSteps.position })
    .from(agentSteps)
    .where(eq(agentSteps.conversationId, conversationId))
    .orderBy(asc(agentSteps.position));
  console.log("\nSteps:", steps.map((s) => `${s.position}. ${s.type}${s.tool ? ` ${s.tool}` : ""}`));
  console.log("\nChat:", (await loadHistory(conversationId)).map((m) => `${m.role}: ${m.content}`));

  await db.delete(conversations).where(eq(conversations.visitorId, VISITOR));
  await db.delete(tickets).where(eq(tickets.visitorId, VISITOR));
  await db.delete(bookings).where(eq(bookings.visitorId, VISITOR));
  await db.delete(flights).where(eq(flights.visitorId, VISITOR));
  await db.$client.end();
}

main().catch(async (error) => {
  console.error(error);
  await db.$client.end();
  process.exit(1);
});