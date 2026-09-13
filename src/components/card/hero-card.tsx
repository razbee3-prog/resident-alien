"use client";

import { ResidentCard } from "@/components/card/resident-card";
import { findCountry } from "@/lib/countries";

export function HeroCard() {
  const country = findCountry("MX")!;
  return (
    <div className="mx-auto w-full max-w-[600px] lg:mx-0">
      <div className="[transform:rotate(-3deg)]">
        <ResidentCard segment="professional" country={country} orientation="landscape" />
      </div>
    </div>
  );
}
