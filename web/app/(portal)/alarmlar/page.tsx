import type { Metadata } from "next";

import { AlarmsView } from "@/components/views/AlarmsView";

export const metadata: Metadata = { title: "Alarmlar" };

export default function AlarmsPage() {
  return <AlarmsView />;
}
