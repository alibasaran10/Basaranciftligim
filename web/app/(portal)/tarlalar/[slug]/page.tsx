import type { Metadata } from "next";

import { FieldDetailView } from "@/components/views/FieldDetailView";

export const metadata: Metadata = { title: "Tarla Detayı" };

export default async function FieldDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <FieldDetailView slug={slug} />;
}
