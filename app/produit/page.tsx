import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductRoute } from "@/components/product/product-route";

export const metadata: Metadata = { title: "Boutique" };

export default function Page() {
  return (
    <Suspense>
      <ProductRoute />
    </Suspense>
  );
}
