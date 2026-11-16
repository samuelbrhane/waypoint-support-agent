import Link from "next/link";

import { LogoMark } from "@/components/brand";

export function SiteFooter() {
  return (
    <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-line px-6 py-8 text-sm text-slate">
      <span className="flex items-center gap-2 text-ink">
        <LogoMark size={20} />
        Waypoint
      </span>
      <nav className="flex flex-wrap items-center gap-6">
        <a href="#how-it-works" className="hover:text-ink">
          How it works
        </a>
        <Link href="/logs" className="hover:text-ink">
          Logs
        </Link>
        <a href="https://github.com/samuelbrhane/waypoint-support-agent" className="hover:text-ink">
          Source code
        </a>
        <span>© 2026 Waypoint</span>
      </nav>
    </footer>
  );
}