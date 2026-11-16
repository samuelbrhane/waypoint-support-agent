import {
  Authority,
  ClosingCta,
  Hero,
  LogsPreview,
  Principles,
  SiteFooter,
  SiteHeader,
} from "@/components/landing";
import { RevealOnScroll } from "@/components/motion";

export default function Home() {
  return (
    <main>
      <div className="bg-night text-paper">
        <SiteHeader />
        <Hero />
      </div>
      <Authority />
      <LogsPreview />
      <Principles />
      <ClosingCta />
      <SiteFooter />
      <RevealOnScroll />
    </main>
  );
}