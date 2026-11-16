import { z } from "zod";

import { db } from "@/lib/db";
import { tickets } from "@/lib/db/schema";

import { normalizeRef } from "../booking-data";
import { defineTool } from "./types";

export const createTicket = defineTool({
  name: "create_ticket",
  description:
    "Hand the case to a human support agent. Use this when the request is outside what you are allowed " +
    "to do (for example a missed connection or a booking with connecting flights), when a tool keeps " +
    "failing after a retry, or when the customer asks for a human. Summarize the problem so the human " +
    "does not need to ask again.",
  schema: z.strictObject({
    booking_ref: z
      .string()
      .nullable()
      .describe("The booking reference if there is one, otherwise null"),
    reason: z
      .enum(["missed_connection", "outside_policy", "tool_failure", "customer_request", "other"])
      .describe("Why the case needs a human"),
    summary: z
      .string()
      .describe("One or two sentences describing the problem and what the customer wants"),
  }),
  async execute({ booking_ref, reason, summary }, { visitorId, conversationId }) {
    const [ticket] = await db
      .insert(tickets)
      .values({
        visitorId,
        conversationId,
        bookingRef: booking_ref ? normalizeRef(booking_ref) : null,
        reason,
        summary,
      })
      .returning({ id: tickets.id });

    return {
      ok: true,
      data: {
        ticket_number: `VT-${String(ticket.id).padStart(5, "0")}`,
        message: "A support agent will contact the customer by email within 24 hours.",
      },
    };
  },
});