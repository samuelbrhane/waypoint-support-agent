import Link from "next/link";

import { Logo } from "@/components/brand";

export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <Link href="/" aria-label="Waypoint home">
        <Logo withAirline={false} />
      </Link>
      <nav className="flex items-center gap-6 text-sm">
        <a href="#how-it-works" className="hidden text-paper/70 hover:text-paper sm:inline">
          How it works
        </a>
        <Link href="/logs" className="text-paper/70 hover:text-paper">
          Logs
        </Link>
        <Link href="/demo" className="rounded-md bg-taxi px-4 py-2 font-medium text-ink hover:bg-taxi/90">
          Try Waypoint
        </Link>
      </nav>
    </header>
  );
}