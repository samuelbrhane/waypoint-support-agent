import type { StripTone } from "@/components/strips";
import type { StepEvent } from "@/lib/chat-events";

type StripProps = { tone: StripTone; label: string; title: string; detail?: string; meta?: string };
type Data = Record<string, any>;

const OUTCOMES: Record<string, string> = {
  resolved: "Resolved",
  open: "Waiting for the customer to confirm",
  clarification: "Asked the customer for details",
  escalated: "Handed to a person",
};

function ms(step: StepEvent): string | undefined {
  return step.durationMs != null ? `${step.durationMs} ms` : undefined;
}

function describeCall(tool: string, input: Data): string {
  switch (tool) {
    case "lookup_booking":
      return `Look up booking ${input.booking_ref}`;
    case "check_change_options":
      return `Check change and refund options for ${input.booking_ref}`;
    case "request_rebooking":
      return `Prepare moving ${input.booking_ref} to ${input.new_flight_number}`;
    case "request_refund":
      return `Prepare a refund for ${input.booking_ref}`;
    case "create_ticket":
      return `Create a ticket for a person (${String(input.reason).replace("_", " ")})`;
    default:
      return tool;
  }
}

function describeResult(tool: string, output: Data): string {
  switch (tool) {
    case "lookup_booking": {
      const route = output.flights?.map((f: Data) => f.from).concat(output.flights?.at(-1)?.to ?? []).join(" → ");
      const issues = output.issues?.length ? `, ${output.issues.length} issue(s) found` : "";
      return `${output.fare_type} fare, ${route}, ${output.status}${issues}`;
    }
    case "check_change_options":
      return output.change?.allowed
        ? `Change allowed, fee ${output.change.fee}, ${output.change.alternatives.length} alternative flight(s)`
        : `No change possible. ${output.change?.reason ?? ""}`;
    case "request_rebooking":
    case "request_refund":
      return "Confirmation card ready for the customer";
    case "create_ticket":
      return `Ticket ${output.ticket_number} created`;
    default:
      return "Done";
  }
}

/** Turn a logged agent step into a readable strip. */
export function stepToStrip(step: StepEvent): StripProps {
  const input = (step.input ?? {}) as Data;
  const output = (step.output ?? {}) as Data;
  const tool = step.toolName ?? "";

  switch (step.type) {
    case "model_call":
      if (step.error) return { tone: "error", label: "Model error", title: step.error, meta: ms(step) };
      return {
        tone: "decision",
        label: "Decides",
        title:
          output.decision === "use_tools"
            ? `Use ${output.tools.join(", ")}`
            : "Reply to the customer",
        detail:
          step.inputTokens != null ? `${step.inputTokens} tokens in, ${step.outputTokens} out` : undefined,
        meta: ms(step),
      };
    case "tool_call":
      return { tone: "tool", label: tool, title: describeCall(tool, input), detail: JSON.stringify(input) };
    case "tool_result":
      return { tone: "result", label: "Result", title: describeResult(tool, output), meta: ms(step) };
    case "tool_error":
      return { tone: "error", label: "Tool error", title: step.error ?? "The tool failed", meta: ms(step) };
    case "retry":
      return { tone: "error", label: "Retrying", title: step.error ?? "Temporary failure", detail: `attempt ${output.attempt} failed`, meta: ms(step) };
    case "confirmation_requested":
      return { tone: "waiting", label: "Waiting for confirmation", title: output.summary };
    case "confirmation_resolved":
      return output.ok
        ? {
            tone: input.decision === "confirm" ? "done" : "result",
            label: input.decision === "confirm" ? "Confirmed" : "Cancelled",
            title: output.message,
          }
        : { tone: "error", label: "Could not complete", title: output.message };
    case "escalation":
      return { tone: "escalation", label: "Handed to a person", title: `Ticket ${output.ticket_number}` };
    case "final_answer":
      return { tone: "result", label: "Replied", title: OUTCOMES[output.outcome] ?? "Replied" };
    default:
      return { tone: "result", label: step.type, title: "" };
  }
}