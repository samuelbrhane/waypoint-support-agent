import type { Metadata } from "next";

import { DemoApp } from "@/components/demo";

export const metadata: Metadata = {
  title: "Try Waypoint · Velmora Air support",
};

export default function DemoPage() {
  return <DemoApp />;
}