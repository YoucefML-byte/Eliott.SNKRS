import { BrandIndex } from "./brand-index";
import { Categories } from "./categories";
import { ConditionGuide } from "./condition-guide";
import { HomeHero } from "./hero";
import { Intro } from "./intro";
import { Services } from "./services";

export function HomePage() {
  return (
    <>
      <HomeHero />
      {/* juste après le tour du logo : les rayons, puis les chiffres du stock */}
      <Categories />
      <Intro />
      <BrandIndex />
      <ConditionGuide />
      <Services />
    </>
  );
}
