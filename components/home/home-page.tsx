import { BrandIndex } from "./brand-index";
import { Collabs } from "./collabs";
import { ConditionGuide } from "./condition-guide";
import { HomeHero } from "./hero";
import { Intro } from "./intro";
import { LatestDrops } from "./latest-drops";
import { Services } from "./services";

export function HomePage() {
  return (
    <>
      <HomeHero />
      <Intro />
      <LatestDrops />
      <Collabs />
      <BrandIndex />
      <ConditionGuide />
      <Services />
    </>
  );
}
