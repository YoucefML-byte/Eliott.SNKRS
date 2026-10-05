import type { Metadata } from "next";

import { ConfirmationView } from "@/components/checkout/confirmation-view";

export const metadata: Metadata = { title: "Commande confirmée" };

export default function Page() {
  return <ConfirmationView />;
}
