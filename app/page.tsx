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
      <SiteHeader />
      <Hero />
      <Authority />
      <LogsPreview />
      <Principles />
      <ClosingCta />
      <SiteFooter />
      <RevealOnScroll />
    </main>
  );
}