import { Hero } from "@/components/sections/hero";
import { Statement } from "@/components/sections/statement";
import { SafetyTeaser } from "@/components/sections/safety-teaser";
import { Cta } from "@/components/sections/cta";

export default function Home() {
  return (
    <>
      <Hero />
      <Statement />
      <SafetyTeaser />
      <Cta />
    </>
  );
}
