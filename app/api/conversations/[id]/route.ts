import { z } from "zod";

import { getConversationDetail } from "@/lib/agent/history";
import { readVisitorId } from "@/lib/visitor";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const visitorId = await readVisitorId();

  if (!visitorId || !z.string().uuid().safeParse(id).success) {
    return Response.json({ error: "Conversation not found." }, { status: 404 });
  }

  const detail = await getConversationDetail(id, visitorId);
  if (!detail) {
    return Response.json({ error: "Conversation not found." }, { status: 404 });
  }

  return Response.json(detail);
}