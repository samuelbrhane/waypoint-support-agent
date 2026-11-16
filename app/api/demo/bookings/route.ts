import { ensureVisitorData, listVisitorBookings } from "@/lib/demo";
import { getOrCreateVisitorId } from "@/lib/visitor";

export async function GET() {
  const visitorId = await getOrCreateVisitorId();
  await ensureVisitorData(visitorId);

  return Response.json({ bookings: await listVisitorBookings(visitorId) });
}