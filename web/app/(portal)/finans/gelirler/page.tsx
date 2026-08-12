import type { Metadata } from "next";

import { FinanceLedger } from "@/components/finance/FinanceLedger";

export const metadata: Metadata = { title: "Gelirler" };

export default function IncomePage() {
  return <FinanceLedger type="income" />;
}
