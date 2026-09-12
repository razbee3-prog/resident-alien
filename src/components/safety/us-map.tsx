"use client";

import { geoAlbersUsa } from "d3-geo";
import { useMemo, useState, type MouseEvent } from "react";
import states from "@/lib/us-states.json";
import { hotspots, type Hotspot } from "@/lib/hotspots";
import { categoryColor, categoryLabel, placeLabel, type Report } from "@/lib/safety";
import { relativeTime } from "@/lib/format";

export type LatLng = { lat: number; lng: number };
const W = 975;
const H = 610;
const projection = geoAlbersUsa().scale(1300).translate([487.5, 305]);

type Props = {
  reports: Report[];
  pending: LatLng | null;
  onPick: (p: LatLng) => void;
  className?: string;
};

export function USMap({ reports, pending, onPick, className = "" }: Props) {
  const [active, setActive] = useState<Hotspot | null>(hotspots[0] ?? null);
  const [activeReport, setActiveReport] = useState<Report | null>(null);

  const spots = useMemo(
    () => hotspots.map((h) => ({ h, xy: projection([h.lng, h.lat]) })).filter((s): s is { h: Hotspot; xy: [number, number] } => !!s.xy),
    [],
  );
  const pins = useMemo(
    () => reports.map((r) => ({ r, xy: projection([r.lng, r.lat]) })).filter((s): s is { r: Report; xy: [number, number] } => !!s.xy),
    [reports],
  );
  const pendingXY = pending ? projection([pending.lng, pending.lat]) : null;

  function onMapClick(e: MouseEvent<SVGSVGElement>) {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    const ll = projection.invert?.([x, y]);
    if (ll) onPick({ lat: ll[1], lng: ll[0] });
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="application" aria-label="Map of the United States with reported enforcement hotspots" onClick={onMapClick}>
          <defs>
            <radialGradient id="hot">
              <stop offset="0" stopColor="#f28c8c" stopOpacity=".55" />
              <stop offset=".45" stopColor="#f28c8c" stopOpacity=".18" />
              <stop offset="1" stopColor="#f28c8c" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g>
            {(states as { id: string; name: string; d: string }[]).map((s) => (
              <path key={s.id} d={s.d} fill="#17171c" stroke="rgba(255,255,255,.14)" strokeWidth="0.8" strokeLinejoin="round">
                <title>{s.name}</title>
              </path>
            ))}
          </g>
          <g>
            {spots.map(({ h, xy }) => {
              const r = 10 + h.level * 8;
              const isActive = active?.city === h.city;
              return (
                <g
                  key={h.city}
                  transform={`translate(${xy[0].toFixed(1)} ${xy[1].toFixed(1)})`}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActive(h);
                    setActiveReport(null);
                  }}
                >
                  <circle r={r} fill="url(#hot)" />
                  <circle r={isActive ? 5.5 : 4} fill="#f28c8c" stroke="#0a0a0d" strokeWidth="1.5" />
                  {isActive ? <circle r={r} fill="none" stroke="#f28c8c" strokeOpacity=".5" strokeWidth="1" /> : null}
                  <title>{`${h.city}: ${h.headline}`}</title>
                </g>
              );
            })}
          </g>
          <g>
            {pins.map(({ r, xy }) => (
              <g
                key={r.id}
                transform={`translate(${xy[0].toFixed(1)} ${xy[1].toFixed(1)})`}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveReport(r);
                  setActive(null);
                }}
              >
                <circle r="9" fill={categoryColor[r.category]} fillOpacity=".18" />
                <circle r="3.5" fill={categoryColor[r.category]} stroke="#0a0a0d" strokeWidth="1.2" />
                <title>{`${categoryLabel(r.category)} · ${placeLabel(r.lat, r.lng)}`}</title>
              </g>
            ))}
          </g>
          {pendingXY ? (
            <g transform={`translate(${pendingXY[0].toFixed(1)} ${pendingXY[1].toFixed(1)})`} pointerEvents="none">
              <circle r="12" fill="rgba(135,133,255,.25)" />
              <circle r="5" fill="#ececf1" stroke="#8785ff" strokeWidth="2.5" />
            </g>
          ) : null}
        </svg>
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2 text-[0.7rem]">
          <span className="rounded-full border border-bad/40 bg-ground/80 px-2.5 py-1 text-bad backdrop-blur">Reported operations, illustrative</span>
          <span className="rounded-full border border-accent/40 bg-ground/80 px-2.5 py-1 text-accent backdrop-blur">Community reports</span>
        </div>
      </div>

      <div className="border-t border-hairline p-5">
        {activeReport ? (
          <div>
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full" style={{ background: categoryColor[activeReport.category] }} aria-hidden="true" />
              <p className="text-sm font-medium text-ink">{categoryLabel(activeReport.category)}</p>
              <span className="ml-auto num text-xs text-faint">{relativeTime(activeReport.created_at)}</span>
            </div>
            <p className="mt-1 text-xs text-muted">{placeLabel(activeReport.lat, activeReport.lng)}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink/90">{activeReport.note}</p>
            <p className="mt-2 text-xs text-faint">{activeReport.confirmations} confirmed · unverified community report</p>
          </div>
        ) : active ? (
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[1.05rem] font-semibold text-ink">
                {active.city}, {active.state}
              </p>
              <span className="text-xs text-muted">{active.when}</span>
            </div>
            <p className="mt-1 text-sm font-medium text-bad">{active.headline}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{active.note}</p>
          </div>
        ) : (
          <p className="text-sm text-muted">Tap a hotspot for what’s been reported there. Tap anywhere else to place a community report.</p>
        )}
      </div>
    </div>
  );
}
