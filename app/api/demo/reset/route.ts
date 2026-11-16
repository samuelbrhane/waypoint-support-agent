import { listVisitorBookings, resetVisitorData } from "@/lib/demo";
import { getOrCreateVisitorId } from "@/lib/visitor";

export async function POST() {
  const visitorId = await getOrCreateVisitorId();
  await resetVisitorData(visitorId);

  return Response.json({ bookings: await listVisitorBookings(visitorId) });
}