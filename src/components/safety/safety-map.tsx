"use client";

import { useEffect, useRef } from "react";
import type * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { relativeTime } from "@/lib/format";
import { categoryColor, categoryLabel, placeLabel, type Report } from "@/lib/safety";

export type LatLng = { lat: number; lng: number };
export type Focus = LatLng & { zoom?: number; key: number };

type Props = {
  reports: Report[];
  pending: LatLng | null;
  onPick: (p: LatLng) => void;
  focus: Focus | null;
  className?: string;
};

const STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: ["a", "b", "c", "d"].map((s) => `https://${s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png`),
      tileSize: 256,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#101014" } },
    { id: "carto", type: "raster", source: "carto", paint: { "raster-opacity": 0.92 } },
  ],
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

function toGeoJSON(reports: Report[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: reports.map((r) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [r.lng, r.lat] },
      properties: { id: r.id, color: categoryColor[r.category], category: r.category, note: r.note, created_at: r.created_at, confirmations: r.confirmations, lat: r.lat, lng: r.lng },
    })),
  };
}

export function SafetyMap({ reports, pending, onPick, focus, className = "" }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const libRef = useRef<typeof maplibregl | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const reportsRef = useRef(reports);
  const onPickRef = useRef(onPick);

  useEffect(() => {
    reportsRef.current = reports;
    const map = mapRef.current;
    const src = map?.getSource("reports") as maplibregl.GeoJSONSource | undefined;
    src?.setData(toGeoJSON(reports));
    if (src) el.current?.setAttribute("data-features", String(reports.length));
  }, [reports]);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    let cancelled = false;
    let map: maplibregl.Map | undefined;
    (async () => {
      const lib = await import("maplibre-gl");
      if (cancelled || !el.current) return;
      libRef.current = lib;
      // The bundler can't expose a "current script" URL, so point MapLibre at its standalone worker (copied by scripts/copy-maplibre-worker.mjs).
      lib.setWorkerUrl("/vendor/maplibre-gl-worker.mjs");
      map = new lib.Map({
        container: el.current,
        style: STYLE,
        center: [-96.5, 38.5],
        zoom: 3.3,
        minZoom: 2.4,
        maxZoom: 16,
        attributionControl: { compact: true },
      });
      map.addControl(new lib.NavigationControl({ showCompass: false }), "top-right");
      mapRef.current = map;
      // Test hook: lets end-to-end checks query the live map without a global.
      (el.current as unknown as { __ra_map?: maplibregl.Map }).__ra_map = map;

      map.on("load", () => el.current?.setAttribute("data-map-loaded", "1"));
      map.once("render", () => el.current?.setAttribute("data-rendered", "1"));
      map.on("style.load", () => {
        if (!map || map.getSource("reports")) return;
        el.current?.setAttribute("data-style-loaded", "1");
        map.addSource("reports", { type: "geojson", data: toGeoJSON(reportsRef.current) });
        el.current?.setAttribute("data-features", String(reportsRef.current.length));
        map.addLayer({
          id: "reports-glow",
          type: "circle",
          source: "reports",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 12, 12, 30],
            "circle-color": ["get", "color"],
            "circle-opacity": 0.16,
            "circle-blur": 0.7,
          },
        });
        map.addLayer({
          id: "reports-dot",
          type: "circle",
          source: "reports",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 4.5, 12, 9],
            "circle-color": ["get", "color"],
            "circle-stroke-color": "#0a0a0d",
            "circle-stroke-width": 1.5,
          },
        });
      });
      map.on("mouseenter", "reports-dot", () => {
        if (map) map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "reports-dot", () => {
        if (map) map.getCanvas().style.cursor = "";
      });
      map.on("click", (e: maplibregl.MapMouseEvent) => {
        if (!map) return;
        const hits = map.getLayer("reports-dot") ? map.queryRenderedFeatures(e.point, { layers: ["reports-dot"] }) : [];
        if (hits.length) {
          const p = hits[0].properties as Record<string, string | number>;
          const html = `<p class="sp-cat" style="color:${esc(String(p.color))}">${esc(categoryLabel(p.category as Report["category"]))}</p>
            <p class="sp-place">${esc(placeLabel(Number(p.lat), Number(p.lng)))} · ${esc(relativeTime(String(p.created_at)))}</p>
            <p class="sp-note">${esc(String(p.note))}</p>
            <p class="sp-meta">${Number(p.confirmations)} confirmed · unverified community report</p>`;
          new lib.Popup({ closeButton: true, maxWidth: "280px", offset: 10 }).setLngLat([Number(p.lng), Number(p.lat)]).setHTML(html).addTo(map);
          return;
        }
        onPickRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      });
    })();
    return () => {
      cancelled = true;
      markerRef.current?.remove();
      markerRef.current = null;
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const lib = libRef.current;
    if (!map || !lib) return;
    if (!pending) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    if (!markerRef.current) {
      const dot = document.createElement("div");
      dot.className = "sp-pin";
      markerRef.current = new lib.Marker({ element: dot, draggable: true })
        .setLngLat([pending.lng, pending.lat])
        .addTo(map);
      markerRef.current.on("dragend", () => {
        const ll = markerRef.current?.getLngLat();
        if (ll) onPickRef.current({ lat: ll.lat, lng: ll.lng });
      });
    } else {
      markerRef.current.setLngLat([pending.lng, pending.lat]);
    }
  }, [pending]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;
    map.flyTo({ center: [focus.lng, focus.lat], zoom: focus.zoom ?? 12, duration: 900, essential: true });
  }, [focus]);

  return (
    <div className={className}>
      <div ref={el} className="h-full w-full" role="application" aria-label="Map of community-reported enforcement activity" />
    </div>
  );
}
