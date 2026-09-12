"use client";

import { ResidentCard } from "@/components/card/resident-card";
import { CountryPicker } from "@/components/country-picker";
import { defaultCountry, findCountry } from "@/lib/countries";
import { setPref, usePrefs } from "@/lib/prefs";
import type { Segment } from "@/lib/segments";

export function SingleCard({ segment }: { segment: Segment }) {
  const prefs = usePrefs();
  const country = findCountry(prefs.country) ?? defaultCountry;
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="w-[270px] rotate-[4deg] sm:w-[300px]">
        <ResidentCard segment={segment} country={country} />
      </div>
      <div className="w-full max-w-[340px]">
        <CountryPicker value={country} onChange={(c) => setPref("country", c.a2)} />
      </div>
    </div>
  );
}
