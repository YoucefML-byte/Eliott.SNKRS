import type { Metadata } from "next";
import { Suspense } from "react";

import { CatalogueView } from "@/components/catalogue/catalogue-view";

export const metadata: Metadata = { title: "Le stock" };

export default function Page() {
  return (
    <Suspense>
      <CatalogueView />
    </Suspense>
  );
}
