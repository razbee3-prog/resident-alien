"use client";

import { cardCountry } from "@/components/card/hero-cards";
import { ResidentCard } from "@/components/card/resident-card";
import { findCountry } from "@/lib/countries";
import type { Segment } from "@/lib/segments";

export function SingleCard({ segment }: { segment: Segment }) {
  const country = findCountry(cardCountry[segment])!;
  return (
    <div className="mx-auto w-[250px] rotate-[4deg] sm:w-[320px]">
      <ResidentCard segment={segment} country={country} />
    </div>
  );
}
