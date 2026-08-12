import type { Metadata } from "next";

import { FinanceLedger } from "@/components/finance/FinanceLedger";

export const metadata: Metadata = { title: "Giderler" };

export default function ExpensesPage() {
  return <FinanceLedger type="expense" />;
}
