// Runs real conversations through the agent and prints each step live
import "./load-env";

import { eq } from "drizzle-orm";

import { addMessage, createConversation } from "@/lib/agent/conversation";
import type { LoggedStep } from "@/lib/agent/logger";
import { runAgentTurn } from "@/lib/agent/loop";
import { db } from "@/lib/db";
import { bookings, conversations, flights, tickets } from "@/lib/db/schema";
import { ensureVisitorData } from "@/lib/demo";

const VISITOR = "test-agent-visitor";

function printStep(step: LoggedStep) {
  const tool = step.toolName ? ` ${step.toolName}` : "";
  const detail = step.error
    ? ` ✗ ${step.error}`
    : step.type === "tool_call"
      ? ` ${JSON.stringify(step.input)}`
      : step.type === "model_call"
        ? ` ${JSON.stringify(step.output)}`
        : step.type === "confirmation_requested"
          ? ` ${(step.output as { summary: string }).summary}`
          : "";
  const time = step.durationMs != null ? ` (${step.durationMs} ms)` : "";
  console.log(`   · ${step.type}${tool}${detail}${time}`);
}

async function conversation(title: string, turns: string[]) {
  console.log(`\n━━ ${title}`);
  let conversationId: string | null = null;

  for (const text of turns) {
    conversationId ??= await createConversation(VISITOR, text);
    await addMessage(conversationId, "user", text);
    console.log(`\n 👤 ${text}`);

    const result = await runAgentTurn({ visitorId: VISITOR, conversationId, onStep: printStep });
    console.log(` 🤖 ${result.text}`);
    console.log(`    outcome: ${result.outcome}`);
  }
}

async function main() {
  await ensureVisitorData(VISITOR);

  await conversation("Clarification", ["Where is my booking?"]);
  await conversation("Free rebooking", ["Can I move my flight VM4821 to a later date?", "VM217 please"]);
  await conversation("Basic fare with fee", ["I want to change VM5190 to a later flight. Is there a cost?"]);
  await conversation("Airline cancellation refund", ["My flight VM3307 was cancelled. I want my money back."]);
  await conversation("Missed connection", ["I missed my connection on booking VM6012. What now?"]);
  await conversation("Tool failure and retry", ["Please move booking VM7745 to flight VM708."]);

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