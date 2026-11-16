import { z } from "zod";

import { resolveAction } from "@/lib/agent/actions";
import type { LoggedStep } from "@/lib/agent/logger";
import type { StepEvent } from "@/lib/chat-events";
import { readVisitorId } from "@/lib/visitor";

const bodySchema = z.object({
  decision: z.enum(["confirm", "cancel"]),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = bodySchema.safeParse(await request.json().catch(() => null));

  if (!z.string().uuid().safeParse(id).success || !body.success) {
    return Response.json({ error: "Send a decision of confirm or cancel." }, { status: 400 });
  }

  const visitorId = await readVisitorId();
  if (!visitorId) {
    return Response.json({ ok: false, message: "This card has already been used or is no longer valid." }, { status: 404 });
  }

  let step: StepEvent | null = null;
  const result = await resolveAction({
    actionId: id,
    visitorId,
    decision: body.data.decision,
    onStep: (logged: LoggedStep) => {
      step = { ...logged, createdAt: logged.createdAt.toISOString() };
    },
  });

  return Response.json({ ok: result.ok, message: result.message, step }, { status: result.ok ? 200 : 409 });
}