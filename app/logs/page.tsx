import type { Metadata } from "next";

import { LogsApp } from "@/components/logs";

export const metadata: Metadata = {
  title: "Logs · Waypoint",
};

export default function LogsPage() {
  return <LogsApp />;
}