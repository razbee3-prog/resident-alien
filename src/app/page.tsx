import { Hero } from "@/components/sections/hero";
import { StatStrip } from "@/components/sections/stat-strip";
import { Problem } from "@/components/sections/problem";
import { Ladder } from "@/components/sections/ladder";
import { TwoPaths } from "@/components/sections/two-paths";
import { Coach } from "@/components/sections/coach";
import { Evidence } from "@/components/sections/evidence";
import { DemoTeaser } from "@/components/readiness/demo-teaser";
import { SafetyTeaser } from "@/components/sections/safety-teaser";
import { Faq } from "@/components/sections/faq";
import { Cta } from "@/components/sections/cta";

export default function Home() {
  return (
    <>
      <Hero />
      <StatStrip />
      <Problem />
      <Ladder />
      <TwoPaths />
      <Coach />
      <Evidence />
      <DemoTeaser />
      <SafetyTeaser />
      <Faq />
      <Cta />
    </>
  );
}
