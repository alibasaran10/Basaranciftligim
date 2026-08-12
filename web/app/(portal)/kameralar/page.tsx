import type { Metadata } from "next";

import { CamerasView } from "@/components/views/CamerasView";

export const metadata: Metadata = { title: "Kameralar" };

export default function CamerasPage() {
  return <CamerasView />;
}
