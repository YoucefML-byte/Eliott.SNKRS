import Link from "next/link";

import { LegacyProductRedirect } from "@/components/product/legacy-product-redirect";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-32 text-center">
      <LegacyProductRedirect />
      <p className="font-mono text-sm text-acc-ink">404</p>
      <h1 className="mt-4 font-display text-5xl uppercase">Paire introuvable</h1>
      <p className="mt-4 text-muted">Elle a peut-être déjà été vendue.</p>
      <Link href="/catalogue" className={buttonVariants({ className: "mt-8" })}>
        Voir le stock
      </Link>
    </div>
  );
}
