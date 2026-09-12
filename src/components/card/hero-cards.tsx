"use client";

import { ResidentCard } from "@/components/card/resident-card";
import { CountryPicker } from "@/components/country-picker";
import { defaultCountry, findCountry } from "@/lib/countries";
import { setPref, usePrefs } from "@/lib/prefs";
import type { Segment } from "@/lib/segments";

const ORDER: Segment[] = ["student", "professional"];

export function HeroCards({ initialFront = "professional" }: { initialFront?: Segment }) {
  const prefs = usePrefs();
  const country = findCountry(prefs.country) ?? defaultCountry;
  const front = prefs.segment ?? initialFront;

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative h-[520px] w-[300px] sm:h-[580px] sm:w-[340px]">
        {ORDER.map((seg) => {
          const isFront = seg === front;
          return (
            <button
              key={seg}
              type="button"
              onClick={() => setPref("segment", seg)}
              aria-label={isFront ? `${seg} card, in front` : `Bring the ${seg} card to the front`}
              aria-pressed={isFront}
              className="absolute left-0 top-0 w-[78%] rounded-[24px] border-0 bg-transparent p-0 text-left transition-[transform,filter] duration-700 ease-[cubic-bezier(.16,1,.3,1)] focus-visible:outline-offset-8"
              style={
                isFront
                  ? { transform: "translate(24%, 7%) rotate(5deg)", zIndex: 2, filter: "none" }
                  : { transform: "translate(-2%, 0%) rotate(-10deg) scale(0.93)", zIndex: 1, filter: "brightness(.62) saturate(.9)" }
              }
            >
              <ResidentCard segment={seg} country={country} interactive={isFront} />
            </button>
          );
        })}
      </div>

      <div className="w-full max-w-[340px]">
        <div className="mb-4 flex rounded-xl border border-hairline bg-surface p-1" role="group" aria-label="Which card is in front">
          {ORDER.map((seg) => (
            <button
              key={seg}
              type="button"
              aria-pressed={front === seg}
              onClick={() => setPref("segment", seg)}
              className={`h-10 flex-1 rounded-lg text-sm font-medium transition-colors ${
                front === seg ? "bg-ink text-ground" : "text-muted hover:text-ink"
              }`}
            >
              {seg === "student" ? "Student" : "Professional"}
            </button>
          ))}
        </div>
        <CountryPicker value={country} onChange={(c) => setPref("country", c.a2)} />
        <p className="mt-2 text-xs text-faint">Your pick is remembered and pre-fills the waitlist.</p>
      </div>
    </div>
  );
}
