import Link from "next/link";

import { Logo } from "@/components/brand";

export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <Link href="/" aria-label="Waypoint home">
        <Logo withAirline={false} />
      </Link>
      <nav className="flex items-center gap-6 text-sm">
        <a href="#how-it-works" className="hidden text-slate hover:text-ink sm:inline">
          How it works
        </a>
        <Link href="/logs" className="text-slate hover:text-ink">
          Logs
        </Link>
        <Link href="/demo" className="rounded-md bg-ink px-4 py-2 font-medium text-paper hover:bg-ink/90">
          Try Waypoint
        </Link>
      </nav>
    </header>
  );
}