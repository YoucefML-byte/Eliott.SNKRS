"use client";

import RibbonGradient from "@/components/ui/ribbon-gradient";
import StackSpread from "@/components/ui/stack-spread";

export function HomeHero() {
  return (
    <StackSpread
      bgColor="#ffffff"
      textColor="#141414"
      scrollLength={260}
      stickyTop={64}
      background={<RibbonGradient />}
    />
  );
}
