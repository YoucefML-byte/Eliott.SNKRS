import type { Metadata } from "next";

import { AdminPage } from "@/components/admin/admin-page";

export const metadata: Metadata = { title: "Espace admin", robots: { index: false, follow: false } };

export default function Page() {
  return <AdminPage />;
}
