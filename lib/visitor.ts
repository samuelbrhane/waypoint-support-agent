import { cookies } from "next/headers";

export const VISITOR_COOKIE = "waypoint_visitor";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIX_MONTHS = 60 * 60 * 24 * 180;

/** Read the visitor ID from the cookie, or create one on the first visit. For API routes. */
export async function getOrCreateVisitorId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(VISITOR_COOKIE)?.value;

  if (existing && UUID.test(existing)) {
    return existing;
  }

  const visitorId = crypto.randomUUID();
  store.set(VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SIX_MONTHS,
  });
  return visitorId;
}

/** Read the visitor ID without creating one. For pages, which cannot set cookies. */
export async function readVisitorId(): Promise<string | null> {
  const store = await cookies();
  const existing = store.get(VISITOR_COOKIE)?.value;
  return existing && UUID.test(existing) ? existing : null;
}