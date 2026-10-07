import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CategoryRoute } from "@/components/shop/routes";
import { CATEGORIES, categoryById } from "@/data/taxonomy";

type Params = Promise<{ category: string; sub: string }>;

export const dynamicParams = false;
export const generateStaticParams = () =>
  CATEGORIES.flatMap((c) => c.subs.map((s) => ({ category: c.id, sub: s.id })));

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category, sub } = await params;
  const cat = categoryById(category);
  const s = cat?.subs.find((x) => x.id === sub);
  return { title: s && cat ? `${s.label} · ${cat.label}` : undefined };
}

export default async function Page({ params }: { params: Params }) {
  const { category, sub } = await params;
  const cat = categoryById(category);
  if (!cat || !cat.subs.some((s) => s.id === sub)) notFound();
  return (
    <Suspense>
      <CategoryRoute category={cat.id} sub={sub} />
    </Suspense>
  );
}
