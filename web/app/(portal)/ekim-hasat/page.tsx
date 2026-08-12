import type { Metadata } from "next";

import { CropRecordsView } from "@/components/views/CropRecordsView";

export const metadata: Metadata = { title: "Ekim & Hasat Kayıtları" };

export default function CropRecordsPage() {
  return <CropRecordsView />;
}
