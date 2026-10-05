import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductView } from "@/components/product/product-view";
import { PRODUCTS } from "@/data/products";
import { fullName, getProduct } from "@/lib/products";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/produit/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = getProduct(slug);
  return product ? { title: `${fullName(product)} ${product.colorway}`, description: product.description } : {};
}

export default async function Page(props: PageProps<"/produit/[slug]">) {
  const { slug } = await props.params;
  const product = getProduct(slug);
  if (!product) notFound();
  return <ProductView product={product} />;
}
