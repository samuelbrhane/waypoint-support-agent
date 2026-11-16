// Runs every tool directly to check results, errors and confirmation cards
import "./load-env";

import { eq } from "drizzle-orm";

import { runTool, toolsByName, type ToolContext } from "@/lib/agent/tools";
import { db } from "@/lib/db";
import { bookings, conversations, flights, pendingActions, tickets } from "@/lib/db/schema";
import { ensureVisitorData } from "@/lib/demo";

const VISITOR = "test-tools-visitor";

async function call(context: ToolContext, name: string, args: unknown) {
  const result = await runTool(toolsByName.get(name)!, JSON.stringify(args), context);
  console.log(`\n▶ ${name} ${JSON.stringify(args)}`);
  console.dir(result, { depth: 5 });
}

async function main() {
  await ensureVisitorData(VISITOR);
  const [conversation] = await db
    .insert(conversations)
    .values({ visitorId: VISITOR, title: "Tool test" })
    .returning({ id: conversations.id });
  const context = { visitorId: VISITOR, conversationId: conversation.id };

  // Lookups
  await call(context, "lookup_booking", { booking_ref: "vm 6012" });
  await call(context, "lookup_booking", { booking_ref: "VM9999" });

  // Options and rules
  await call(context, "check_change_options", { booking_ref: "VM5190" });
  await call(context, "check_change_options", { booking_ref: "VM2654" });
  await call(context, "check_change_options", { booking_ref: "VM3307" });

  // Rebooking: valid, invalid flight, and the simulated timeout
  await call(context, "request_rebooking", { booking_ref: "VM4821", new_flight_number: "VM217" });
  await call(context, "request_rebooking", { booking_ref: "VM4821", new_flight_number: "VM999" });
  await call(context, "request_rebooking", { booking_ref: "VM7745", new_flight_number: "VM708" });
  await call(context, "request_rebooking", { booking_ref: "VM7745", new_flight_number: "VM708" });

  // Refunds: not allowed, then allowed
  await call(context, "request_refund", { booking_ref: "VM5190" });
  await call(context, "request_refund", { booking_ref: "VM3307" });

  // Handoff and bad arguments
  await call(context, "create_ticket", {
    booking_ref: "VM6012",
    reason: "missed_connection",
    summary: "Customer missed VM612 after VM508 was delayed 140 minutes and needs a new connection to Lisbon.",
  });
  await call(context, "lookup_booking", {});

  const pending = await db.select().from(pendingActions).where(eq(pendingActions.visitorId, VISITOR));
  console.log("\nPending actions:", pending.map((p) => `${p.bookingRef} ${p.action} ${p.status}`));

  // Clean up
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