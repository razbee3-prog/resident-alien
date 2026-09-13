"use client";

import { ResidentCard } from "@/components/card/resident-card";
import { findCountry } from "@/lib/countries";
import { setPref, usePrefs } from "@/lib/prefs";
import type { Segment } from "@/lib/segments";

const ORDER: Segment[] = ["student", "professional"];
export const cardCountry: Record<Segment, string> = { student: "GB", professional: "MX" };

export function HeroCards() {
  const prefs = usePrefs();
  const front = prefs.segment ?? "professional";

  return (
    <div className="relative mx-auto h-[400px] w-full max-w-[760px] sm:h-[540px] md:h-[590px]">
      {ORDER.map((seg) => {
        const isFront = seg === front;
        const student = seg === "student";
        const country = findCountry(cardCountry[seg])!;
        return (
          <button
            key={seg}
            type="button"
            onClick={() => setPref("segment", seg)}
            aria-label={`${seg} card${isFront ? ", in front" : ""}`}
            aria-pressed={isFront}
            className="absolute left-1/2 top-0 w-[224px] rounded-[24px] border-0 bg-transparent p-0 text-left transition-[transform,filter] duration-700 ease-[cubic-bezier(.16,1,.3,1)] focus-visible:outline-offset-8 sm:w-[300px] md:w-[330px]"
            style={{
              transform: `translateX(${student ? "-90%" : "-10%"}) translateY(${isFront ? "0px" : "22px"}) rotate(${student ? "-7deg" : "6deg"})`,
              zIndex: isFront ? 2 : 1,
              filter: isFront ? "none" : "brightness(.8)",
            }}
          >
            <ResidentCard segment={seg} country={country} />
          </button>
        );
      })}
    </div>
  );
}
