const AIRPORTS = [
  { code: "LIS", x: 60, y: 270 },
  { code: "BCN", x: 230, y: 245 },
  { code: "FCO", x: 360, y: 275 },
  { code: "AMS", x: 250, y: 140 },
  { code: "CPH", x: 380, y: 110 },
  { code: "VIE", x: 470, y: 190 },
];

const ROUTES = [
  "M250 140 Q225 195 230 245",
  "M380 110 Q315 115 250 140",
  "M470 190 Q460 135 380 110",
  "M230 245 Q295 280 360 275",
  "M60 270 Q265 150 470 190",
];

// Rome to Lisbon, the route of booking VM4821
const FLIGHT_PATH = "M360 275 Q210 320 60 270";

const WAYPOINTS = [
  { x: 210, y: 296 },
  { x: 238, y: 192 },
  { x: 315, y: 118 },
];

// A small airliner seen from above, nose pointing right
const AIRCRAFT =
  "M9 0 L5 -1.2 L1 -1.2 L-2 -7 L-4 -7 L-2.5 -1.2 L-6 -1.2 L-8 -3.5 L-9.5 -3.5 L-8.5 0 " +
  "L-9.5 3.5 L-8 3.5 L-6 1.2 L-2.5 1.2 L-4 7 L-2 7 L1 1.2 L5 1.2 Z";

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
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full text-glow"
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" opacity="0.28">
        {ROUTES.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>

      <path d={FLIGHT_PATH} fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />

      <g opacity="0.45">
        {WAYPOINTS.map((w) => (
          <WaypointStar key={`${w.x}-${w.y}`} x={w.x} y={w.y} />
        ))}
      </g>

      {AIRPORTS.map((a) => (
        <g key={a.code} opacity="0.7">
          <circle cx={a.x} cy={a.y} r="3" fill="currentColor" />
          <text x={a.x + 8} y={a.y + 4} className="fill-current font-mono" fontSize="11">
            {a.code}
          </text>
        </g>
      ))}

      <g className="flight-dot">
        <path d={AIRCRAFT} fill="var(--color-taxi)" />
        <animateMotion dur="11s" repeatCount="indefinite" path={FLIGHT_PATH} rotate="auto" />
      </g>
    </svg>
  );
}