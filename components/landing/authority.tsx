const LEVELS = [
  {
    title: "Does on its own",
    edge: "border-slate",
    text: "Fast, safe, and nothing changes.",
    items: ["Looks up bookings and flights", "Applies fare and refund rules", "Retries a system that times out"],
  },
  {
    title: "Asks you first",
    edge: "border-taxi",
    text: "Shown as a card. Nothing happens until you press Confirm.",
    items: ["Moves a booking to another flight", "Refunds a booking"],
  },
  {
    title: "Hands to a person",
    edge: "border-ink",
    text: "Creates a ticket with a summary, so you never repeat yourself.",
    items: ["Missed connections", "Requests outside the rules", "Systems that keep failing"],
  },
];

export function Authority() {
  return (
    <section id="how-it-works" className="scroll-mt-6 border-y border-line bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="max-w-2xl font-display text-4xl font-bold tracking-tight">
          Clear limits on what the agent is allowed to do
        </h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {LEVELS.map((level) => (
            <div key={level.title} className={`border-t-4 pt-5 ${level.edge}`}>
              <h3 className="font-display text-2xl font-semibold">{level.title}</h3>
              <p className="mt-2 text-sm text-slate">{level.text}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {level.items.map((item) => (
                  <li key={item} className="border-b border-line pb-2 last:border-0">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}