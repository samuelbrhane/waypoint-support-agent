import type { ActionType, ConversationOutcome, StepType } from "@/lib/db/schema";

/** One agent step as sent to the browser. */
export type StepEvent = {
  id: number;
  turn: number;
  position: number;
  type: StepType;
  toolName: string | null;
  input: unknown;
  output: unknown;
  error: string | null;
  durationMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  createdAt: string;
};

/** A confirmation card waiting for the customer. */
export type ActionCard = {
  id: string;
  action: ActionType;
  bookingRef: string;
  summary: string;
};

/** Every event the chat stream can send, one per line. */
export type ChatEvent =
  | { type: "conversation"; conversationId: string }
  | { type: "step"; step: StepEvent }
  | { type: "text"; delta: string }
  | { type: "text_reset" }
  | {
      type: "done";
      text: string;
      outcome: ConversationOutcome;
      cards: ActionCard[];
      ticketNumber: string | null;
    }
  | { type: "error"; message: string };