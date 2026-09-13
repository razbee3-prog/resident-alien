"use client";

import { ResidentCard } from "@/components/card/resident-card";
import { findCountry } from "@/lib/countries";
import type { Segment } from "@/lib/segments";

export const cardCountry: Record<Segment, string> = { student: "GB", professional: "MX" };

export function SingleCard({ segment, country }: { segment: Segment; country?: string }) {
  const c = findCountry(country ?? cardCountry[segment])!;
  return (
    <div className="mx-auto w-full max-w-[560px] lg:mx-0">
      <div className="[transform:rotate(-3deg)]">
        <ResidentCard segment={segment} country={c} orientation="landscape" />
      </div>
    </div>
  );
}
