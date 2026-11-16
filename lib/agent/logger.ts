import { db } from "@/lib/db";
import { agentSteps, type StepType } from "@/lib/db/schema";

export type LoggedStep = typeof agentSteps.$inferSelect;

export type StepInput = {
  type: StepType;
  toolName?: string | null;
  input?: unknown;
  output?: unknown;
  error?: string | null;
  durationMs?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
};

/** Saves each agent step in order and passes it to a listener, such as a stream. */
export class StepLogger {
  private position = 0;

  constructor(
    private readonly conversationId: string,
    private readonly turn: number,
    private readonly onStep?: (step: LoggedStep) => void,
  ) {}

  async log(step: StepInput): Promise<LoggedStep> {
    this.position += 1;

    const [row] = await db
      .insert(agentSteps)
      .values({
        conversationId: this.conversationId,
        turn: this.turn,
        position: this.position,
        ...step,
      })
      .returning();

    this.onStep?.(row);
    return row;
  }
}

/** Runs a function and measures how long it took. */
export async function measure<T>(fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
  const start = performance.now();
  const result = await fn();
  return { result, durationMs: Math.round(performance.now() - start) };
}