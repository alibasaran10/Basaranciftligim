import type { Metadata } from "next";

import { HerdView } from "@/components/views/HerdView";

export const metadata: Metadata = { title: "Sürü Yönetimi" };

export default function HerdPage() {
  return <HerdView />;
}
