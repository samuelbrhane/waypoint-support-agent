// Runs every scenario through the real agent and checks its behaviour
import "../scripts/load-env";

import { and, asc, eq, inArray, like } from "drizzle-orm";

import { addMessage, createConversation } from "@/lib/agent/conversation";
import { runAgentTurn } from "@/lib/agent/loop";
import { db } from "@/lib/db";
import { agentSteps, bookings, conversations, flights, pendingActions, tickets } from "@/lib/db/schema";
import { ensureVisitorData } from "@/lib/demo";

import { type Expectation, SCENARIOS } from "./scenarios";

type Check = { name: string; passed: boolean; detail?: string };

function checkScenario(
  expect: Expectation,
  facts: { tools: string[]; cards: string[]; ticket: boolean; retry: boolean; reply: string; outcome: string },
): Check[] {
  const checks: Check[] = [];
  const reply = facts.reply.toLowerCase();

  for (const tool of expect.tools ?? []) {
    checks.push({ name: `uses ${tool}`, passed: facts.tools.includes(tool), detail: `used ${facts.tools.join(", ") || "none"}` });
  }
  if (expect.forbiddenTools === "all") {
    checks.push({ name: "uses no tools", passed: facts.tools.length === 0, detail: `used ${facts.tools.join(", ")}` });
  } else {
    for (const tool of expect.forbiddenTools ?? []) {
      checks.push({ name: `does not use ${tool}`, passed: !facts.tools.includes(tool) });
    }
  }
  if (expect.card === "none") {
    checks.push({ name: "creates no card", passed: facts.cards.length === 0, detail: facts.cards.join(", ") });
  } else if (expect.card) {
    checks.push({ name: `creates a ${expect.card} card`, passed: facts.cards.includes(expect.card), detail: facts.cards.join(", ") || "none" });
  }
  if (expect.ticket !== undefined) {
    checks.push({ name: expect.ticket ? "creates a ticket" : "creates no ticket", passed: facts.ticket === expect.ticket });
  }
  if (expect.retry) {
    checks.push({ name: "retries the failed tool", passed: facts.retry });
  }
  if (expect.replyMentions) {
    checks.push({
      name: `reply mentions ${expect.replyMentions.join(" or ")}`,
      passed: expect.replyMentions.some((word) => reply.includes(word.toLowerCase())),
    });
  }
  if (expect.outcome) {
    checks.push({ name: `outcome is ${expect.outcome}`, passed: facts.outcome === expect.outcome, detail: facts.outcome });
  }

  return checks;
}

async function main() {
  let passedScenarios = 0;
  let totalTokens = 0;
  const started = Date.now();

  for (const [index, scenario] of SCENARIOS.entries()) {
    const visitorId = `eval-visitor-${index}`;
    await ensureVisitorData(visitorId);

    let conversationId: string | null = null;
    let result: Awaited<ReturnType<typeof runAgentTurn>> | null = null;

    for (const message of scenario.messages) {
      conversationId ??= await createConversation(visitorId, message);
      await addMessage(conversationId, "user", message);
      result = await runAgentTurn({ visitorId, conversationId });
    }

    const lastTurn = scenario.messages.length;
    const steps = await db
      .select()
      .from(agentSteps)
      .where(eq(agentSteps.conversationId, conversationId!))
      .orderBy(asc(agentSteps.turn), asc(agentSteps.position));
    const lastSteps = steps.filter((s) => s.turn === lastTurn);

    const cards = result!.pendingActionIds.length
      ? await db
          .select({ action: pendingActions.action })
          .from(pendingActions)
          .where(and(inArray(pendingActions.id, result!.pendingActionIds), eq(pendingActions.status, "pending")))
      : [];

    totalTokens += steps.reduce((sum, s) => sum + (s.inputTokens ?? 0) + (s.outputTokens ?? 0), 0);

    const checks = checkScenario(scenario.expect, {
      tools: lastSteps.filter((s) => s.type === "tool_call").map((s) => s.toolName!),
      cards: cards.map((c) => c.action),
      ticket: result!.ticketNumber !== null,
      retry: lastSteps.some((s) => s.type === "retry"),
      reply: result!.text,
      outcome: result!.outcome,
    });

    const passed = checks.every((c) => c.passed);
    if (passed) passedScenarios += 1;

    console.log(`\n${passed ? "PASS" : "FAIL"}  ${scenario.name}`);
    for (const check of checks) {
      console.log(`      ${check.passed ? "✓" : "✗"} ${check.name}${!check.passed && check.detail ? ` (${check.detail})` : ""}`);
    }
    if (!passed) console.log(`      reply: ${result!.text.slice(0, 160)}`);
  }

  console.log(`\n${passedScenarios}/${SCENARIOS.length} scenarios passed`);
  console.log(`${totalTokens.toLocaleString("en")} tokens, ${Math.round((Date.now() - started) / 1000)} s`);

  // Clean up the evaluation visitors
  await db.delete(conversations).where(like(conversations.visitorId, "eval-visitor-%"));
  await db.delete(tickets).where(like(tickets.visitorId, "eval-visitor-%"));
  await db.delete(bookings).where(like(bookings.visitorId, "eval-visitor-%"));
  await db.delete(flights).where(like(flights.visitorId, "eval-visitor-%"));
  await db.$client.end();

  process.exit(passedScenarios === SCENARIOS.length ? 0 : 1);
}

main().catch(async (error) => {
  console.error(error);
  await db.$client.end();
  process.exit(1);
});