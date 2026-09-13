import { Hero } from "@/components/sections/hero";
import { Features } from "@/components/sections/features";
import { Dream } from "@/components/sections/dream";
import { CardsTable } from "@/components/sections/cards-table";
import { Statement } from "@/components/sections/statement";
import { SafetyTeaser } from "@/components/sections/safety-teaser";
import { Faq } from "@/components/sections/faq";
import { Cta } from "@/components/sections/cta";

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <Dream />
      <CardsTable />
      <Statement />
      <SafetyTeaser />
      <Faq />
      <Cta />
    </>
  );
}
