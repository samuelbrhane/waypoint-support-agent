import {
  Authority,
  ClosingCta,
  Hero,
  LogsPreview,
  Principles,
  SiteFooter,
  SiteHeader,
} from "@/components/landing";

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
    </main>
  );
}