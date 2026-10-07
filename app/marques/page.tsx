import type { Metadata } from "next";
import { Suspense } from "react";

import { BrandRoute } from "@/components/shop/routes";

export const metadata: Metadata = { title: "Marques" };

export default function Page() {
  return (
    <Suspense>
      <BrandRoute />
    </Suspense>
  );
}
