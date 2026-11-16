import { z } from "zod";

import { getOpenCards } from "@/lib/agent/actions";
import { addMessage, createConversation, getConversation } from "@/lib/agent/conversation";
import { runAgentTurn } from "@/lib/agent/loop";
import type { ChatEvent } from "@/lib/chat-events";
import { ensureVisitorData } from "@/lib/demo";
import { checkMessageLimit } from "@/lib/limits";
import { getOrCreateVisitorId } from "@/lib/visitor";

export const maxDuration = 60;

const bodySchema = z.object({
  message: z.string().trim().min(1).max(1000),
  conversationId: z.string().uuid().nullish(),
});

export async function POST(request: Request) {
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return Response.json({ error: "Send a message between 1 and 1000 characters." }, { status: 400 });
  }

  const { message } = body.data;
  const visitorId = await getOrCreateVisitorId();

  const limit = await checkMessageLimit(visitorId);
  if (limit) {
    return Response.json({ error: limit }, { status: 429 });
  }

  await ensureVisitorData(visitorId);

  let conversationId = body.data.conversationId ?? null;
  if (conversationId) {
    const conversation = await getConversation(conversationId, visitorId);
    if (!conversation) {
      return Response.json({ error: "Conversation not found." }, { status: 404 });
    }
  } else {
    conversationId = await createConversation(visitorId, message);
  }

  await addMessage(conversationId, "user", message);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: ChatEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));

      send({ type: "conversation", conversationId });

      try {
        const result = await runAgentTurn({
          visitorId,
          conversationId,
          onStep: (step) => send({ type: "step", step: { ...step, createdAt: step.createdAt.toISOString() } }),
          onText: (delta) => send({ type: "text", delta }),
          onTextReset: () => send({ type: "text_reset" }),
        });
        send({
          type: "done",
          text: result.text,
          outcome: result.outcome,
          cards: await getOpenCards(result.pendingActionIds),
          ticketNumber: result.ticketNumber,
        });
      } catch (error) {
        console.error("Agent turn failed", error);
        send({ type: "error", message: "Something went wrong. Please try again." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}