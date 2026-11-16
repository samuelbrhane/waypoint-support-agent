const AIRPORTS = [
  { code: "LIS", x: 70, y: 330 },
  { code: "BCN", x: 250, y: 300 },
  { code: "FCO", x: 380, y: 345 },
  { code: "AMS", x: 270, y: 120 },
  { code: "CPH", x: 410, y: 60 },
  { code: "VIE", x: 480, y: 205 },
];

const ROUTES = [
  "M270 120 Q240 215 250 300",
  "M410 60 Q340 75 270 120",
  "M480 205 Q480 120 410 60",
  "M250 300 Q315 345 380 345",
  "M70 330 Q275 170 480 205",
];

// Rome to Lisbon, the route of booking VM4821
const FLIGHT_PATH = "M380 345 Q225 395 70 330";

function WaypointStar({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M${x} ${y - 5} L${x + 1.6} ${y - 1.6} L${x + 5} ${y} L${x + 1.6} ${y + 1.6} L${x} ${y + 5} L${x - 1.6} ${y + 1.6} L${x - 5} ${y} L${x - 1.6} ${y - 1.6} Z`}
      fill="currentColor"
    />
  );
}

export function RouteMap() {
  return (
    <svg
      viewBox="0 0 560 420"
      preserveAspectRatio="xMinYMid slice"
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full text-ink"
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" opacity="0.14">
        {ROUTES.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>

      <path d={FLIGHT_PATH} fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.22" />

      <g opacity="0.25">
        <WaypointStar x={225} y={370} />
        <WaypointStar x={262} y={210} />
        <WaypointStar x={340} y={92} />
      </g>

      {AIRPORTS.map((a) => (
        <g key={a.code} opacity="0.4">
          <circle cx={a.x} cy={a.y} r="3" fill="currentColor" />
          <text x={a.x + 8} y={a.y + 4} className="fill-current font-mono" fontSize="11">
            {a.code}
          </text>
        </g>
      ))}

      <circle r="4.5" fill="var(--color-taxi)" className="flight-dot">
        <animateMotion dur="11s" repeatCount="indefinite" path={FLIGHT_PATH} />
      </circle>
    </svg>
  );
}