import type { Metadata } from "next";

import { CalendarView } from "@/components/views/CalendarView";

export const metadata: Metadata = { title: "Takvim" };

export default function CalendarPage() {
  return <CalendarView />;
}
