type LogoProps = {
  withAirline?: boolean;
};

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="12.5" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      <path d="M14 3 L16.6 11.4 L25 14 L16.6 16.6 L14 25 L11.4 16.6 L3 14 L11.4 11.4 Z" fill="currentColor" />
      <circle cx="14" cy="14" r="2.2" fill="var(--color-taxi)" />
    </svg>
  );
}

export function Logo({ withAirline = true }: LogoProps) {
  return (
    <span className="flex items-center gap-2.5 text-ink">
      <LogoMark />
      <span className="flex items-baseline gap-2">
        <span className="font-display text-2xl font-bold tracking-tight">Waypoint</span>
        {withAirline && <span className="text-sm text-slate">for Velmora Air</span>}
      </span>
    </span>
  );
}