import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CategoryRoute } from "@/components/shop/routes";
import { CATEGORIES, categoryById } from "@/data/taxonomy";

type Params = Promise<{ category: string }>;

export const dynamicParams = false;
export const generateStaticParams = () => CATEGORIES.map((c) => ({ category: c.id }));

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const cat = categoryById((await params).category);
  return { title: cat?.label };
}

export default async function Page({ params }: { params: Params }) {
  const cat = categoryById((await params).category);
  if (!cat) notFound();
  return (
    <Suspense>
      <CategoryRoute category={cat.id} />
    </Suspense>
  );
}
