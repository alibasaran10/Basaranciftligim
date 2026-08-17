import type { Metadata } from "next";

import { HelpView } from "@/components/views/HelpView";

export const metadata: Metadata = {
  title: "Yardım Merkezi & Kullanım Kılavuzu | Basaranciftligim",
};

export default function HelpPage() {
  return <HelpView />;
}
