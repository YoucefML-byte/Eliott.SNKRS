import type { Metadata } from "next";
import { Suspense } from "react";

import { ConfirmationView } from "@/components/checkout/confirmation-view";

export const metadata: Metadata = { title: "Commande confirmée" };

export default function Page() {
  return (
    <Suspense>
      <ConfirmationView />
    </Suspense>
  );
}
