import { BrandIndex } from "./brand-index";
import { Categories } from "./categories";
import { ConditionGuide } from "./condition-guide";
import { HomeHero } from "./hero";
import { Services } from "./services";

export function HomePage() {
  return (
    <>
      <HomeHero />
      {/* juste après le tour du logo : les rayons */}
      <Categories />
      <BrandIndex />
      <ConditionGuide />
      <Services />
    </>
  );
}
