import type { Metadata } from "next";

import { FieldsView } from "@/components/views/FieldsView";

export const metadata: Metadata = { title: "Tarla Yönetimi" };

export default function FieldsPage() {
  return <FieldsView />;
}
