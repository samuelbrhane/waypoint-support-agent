const ROWS = [
  { flight: "VM217", city: "Lisbon", time: "09:40", status: "Boarding", tone: "text-taxi" },
  { flight: "VM332", city: "Rome", time: "10:10", status: "On time", tone: "text-glow" },
  { flight: "VM120", city: "Copenhagen", time: "17:05", status: "On time", tone: "text-glow" },
];

export function GateDisplay() {
  return (
    <div className="rounded-lg bg-night p-4 font-mono text-sm shadow-lg shadow-night/20">
      <div className="mb-3 flex justify-between text-xs text-paper/45">
        <span>Departures</span>
        <span>Gate B12</span>
      </div>
      <ul className="space-y-1.5">
        {ROWS.map((row) => (
          <li key={row.flight} className="grid grid-cols-[4.5rem_1fr_3.5rem_5rem] gap-2 text-paper">
            <span className="text-taxi">{row.flight}</span>
            <span className="truncate">{row.city}</span>
            <span>{row.time}</span>
            <span className={`text-right ${row.tone}`}>{row.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}