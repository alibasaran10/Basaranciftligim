import type { Metadata } from "next";

import { UsersView } from "@/components/views/UsersView";

export const metadata: Metadata = { title: "Kullanıcılar" };

export default function UsersPage() {
  return <UsersView />;
}
