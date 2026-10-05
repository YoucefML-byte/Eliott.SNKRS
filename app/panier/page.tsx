import type { Metadata } from "next";

import { CartPageView } from "@/components/cart/cart-page-view";

export const metadata: Metadata = { title: "Panier" };

export default function Page() {
  return <CartPageView />;
}
