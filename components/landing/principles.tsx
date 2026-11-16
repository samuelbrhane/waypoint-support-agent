const PRINCIPLES = [
  {
    title: "Rules live in code",
    text: "Fees, refund amounts and change limits are calculated by your rules, never guessed by the model. Every answer quotes the rule behind it.",
  },
  {
    title: "Nothing changes without consent",
    text: "Rebooking and refunds become a card the customer confirms. The model cannot carry out a change on its own.",
  },
  {
    title: "Safe when systems fail",
    text: "Temporary failures are retried automatically, a double click can never refund twice, and anything still failing goes to a person.",
  },
  {
    title: "A full record of every step",
    text: "Every decision, tool call, result and confirmation is stored with its timing and token use.",
  },
];

export function Principles() {
  return (
    <section className="border-y border-line bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="max-w-2xl font-display text-4xl font-bold tracking-tight">Built to be trusted with real customers</h2>
        <dl className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="reveal border-l-2 border-line pl-5">
              <dt className="font-display text-2xl font-semibold">{p.title}</dt>
              <dd className="mt-2 leading-relaxed text-slate">{p.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}