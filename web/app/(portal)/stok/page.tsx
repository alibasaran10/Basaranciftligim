import type { Metadata } from "next";

import { StockView } from "@/components/views/StockView";

export const metadata: Metadata = { title: "Stok Yönetimi" };

export default function StockPage() {
  return <StockView />;
}
