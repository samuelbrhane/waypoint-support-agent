import { listConversations } from "@/lib/agent/history";
import { readVisitorId } from "@/lib/visitor";

export async function GET() {
  const visitorId = await readVisitorId();
  if (!visitorId) {
    return Response.json({ conversations: [] });
  }

  return Response.json({ conversations: await listConversations(visitorId) });
}