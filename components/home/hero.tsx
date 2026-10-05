"use client";

import StackSpread from "@/components/ui/stack-spread";

export function HomeHero() {
  return (
    <StackSpread
      bgColor="#050a07"
      textColor="#e9f0eb"
      scrollLength={260}
      stickyTop={64}
      title={
        <>
          Eliott <span className="text-acc">SNKRS</span>
        </>
      }
    />
  );
}
