import { Hero } from "@/components/sections/hero";
import { Benefits } from "@/components/sections/benefits";
import { TwoPaths } from "@/components/sections/two-paths";
import { Statement } from "@/components/sections/statement";
import { SafetyTeaser } from "@/components/sections/safety-teaser";
import { Cta } from "@/components/sections/cta";

export default function Home() {
  return (
    <>
      <Hero />
      <Benefits />
      <TwoPaths />
      <Statement />
      <SafetyTeaser />
      <Cta />
    </>
  );
}
