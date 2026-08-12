import type { Metadata } from "next";

import { FinanceOverviewView } from "@/components/views/FinanceOverviewView";

export const metadata: Metadata = { title: "Finansal Genel Bakış" };

export default function FinancePage() {
  return <FinanceOverviewView />;
}
