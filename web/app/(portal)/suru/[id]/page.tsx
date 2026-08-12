import type { Metadata } from "next";

import { HerdDetailView } from "@/components/views/HerdDetailView";

export const metadata: Metadata = { title: "Sürü Detayı" };

export default async function HerdDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HerdDetailView animalId={id} />;
}
