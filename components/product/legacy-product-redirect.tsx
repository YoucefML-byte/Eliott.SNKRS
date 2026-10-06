"use client";

import { useEffect } from "react";

import { BASE_PATH } from "@/lib/asset";
import { productHref } from "@/lib/products";

/** Old links /produit/<slug>/ now live at /produit/?p=<slug>. */
export function LegacyProductRedirect() {
  useEffect(() => {
    const path = window.location.pathname.slice(BASE_PATH.length);
    const slug = path.match(/^\/produit\/([^/?#]+)\/?$/)?.[1];
    if (slug) window.location.replace(BASE_PATH + productHref(decodeURIComponent(slug)));
  }, []);
  return null;
}
