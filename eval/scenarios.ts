export type Expectation = {
  tools?: string[]; // must be called in the last message
  forbiddenTools?: string[] | "all"; // must not be called in the last message
  card?: "rebook" | "refund" | "none";
  ticket?: boolean;
  retry?: boolean;
  replyMentions?: string[]; // the reply must contain at least one of these
  outcome?: "resolved" | "open" | "clarification" | "escalated";
};

export type Scenario = {
  name: string;
  messages: string[];
  expect: Expectation;
};

export const SCENARIOS: Scenario[] = [
  {
    name: "Asks for a missing booking reference",
    messages: ["Where is my booking?"],
    expect: { forbiddenTools: "all", outcome: "clarification" },
  },
  {
    name: "Offers free rebooking options without acting",
    messages: ["Can I move my flight VM4821 to a later date?"],
    expect: {
      tools: ["check_change_options"],
      forbiddenTools: ["request_rebooking"],
      card: "none",
      replyMentions: ["VM216", "VM217"],
    },
  },
  {
    name: "Prepares a rebooking card after the customer chooses",
    messages: ["Can I move my flight VM4821 to a later date?", "VM217 please"],
    expect: { tools: ["request_rebooking"], card: "rebook", outcome: "open" },
  },
  {
    name: "Quotes the change fee on a Basic fare",
    messages: ["I want to change VM5190 to a later flight. Is there a cost?"],
    expect: { forbiddenTools: ["request_rebooking"], replyMentions: ["60"] },
  },
  {
    name: "Applies the Gold member exception",
    messages: ["Can I move VM2654 to the next day? I'm a Gold member."],
    expect: { tools: ["check_change_options"], replyMentions: ["free", "no fee", "no change fee", "0.00"] },
  },
  {
    name: "Offers a full refund after an airline cancellation",
    messages: ["My flight VM3307 was cancelled. I want my money back."],
    expect: { forbiddenTools: ["create_ticket"], replyMentions: ["129"] },
  },
  {
    name: "Refuses a refund on a non-refundable fare",
    messages: ["I want a refund for booking VM5190."],
    expect: { forbiddenTools: ["request_refund"], card: "none", replyMentions: ["non-refundable", "not refundable"] },
  },
  {
    name: "Hands a missed connection to a person",
    messages: ["I missed my connection on booking VM6012. What now?"],
    expect: { tools: ["create_ticket"], forbiddenTools: ["request_rebooking"], ticket: true, outcome: "escalated" },
  },
  {
    name: "Retries after a system timeout",
    messages: ["Please move booking VM7745 to flight VM708."],
    expect: { tools: ["request_rebooking"], retry: true, card: "rebook" },
  },
  {
    name: "Does not invent an unknown booking",
    messages: ["Can you check booking VM9999 for me?"],
    expect: {
      forbiddenTools: ["request_rebooking", "request_refund"],
      card: "none",
      replyMentions: ["couldn't find", "could not find", "no booking", "check the reference", "not find"],
    },
  },
  {
    name: "Rejects a flight that is not a real alternative",
    messages: ["Move booking VM4821 to flight VM999."],
    expect: { card: "none" },
  },
  {
    name: "Escalates when the customer asks for a person",
    messages: ["I want to talk to a human about my booking VM4821."],
    expect: { tools: ["create_ticket"], ticket: true, outcome: "escalated" },
  },
  {
    name: "Stays on topic",
    messages: ["What's the weather in Lisbon?"],
    expect: { forbiddenTools: "all", card: "none" },
  },
];