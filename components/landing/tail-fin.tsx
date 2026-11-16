export function TailFin() {
  return (
    <svg viewBox="0 0 320 300" className="h-full w-full" aria-hidden="true">
      {/* Fuselage edge at the bottom */}
      <rect x="0" y="270" width="320" height="30" fill="#e8eef5" />
      {/* The fin */}
      <path d="M70 272 L250 272 L300 30 Q304 8 282 10 L242 18 Z" fill="#ffffff" />
      {/* Livery: a yellow sweep and a navy band */}
      <path d="M95 272 L165 272 L272 70 L258 52 Z" fill="var(--color-taxi)" />
      <path d="M165 272 L190 272 L282 92 L272 70 Z" fill="var(--color-night-raised)" />
      {/* Waypoint star */}
      <path
        d="M262 140 L268 158 L286 164 L268 170 L262 188 L256 170 L238 164 L256 158 Z"
        fill="var(--color-night)"
      />
      {/* Navigation light */}
      <circle cx="288" cy="16" r="4" fill="var(--color-stop)" />
    </svg>
  );
}