import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(160deg, #141419 0%, #0a0a0d 60%)",
          color: "#ececf1",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 22, letterSpacing: 6 }}>
          <div style={{ width: 22, height: 22, borderRadius: 999, background: "#ececf1" }} />
          RESIDENT ALIEN
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 0.98, letterSpacing: -4, maxWidth: 900 }}>{site.tagline}</div>
          <div style={{ fontSize: 28, color: "#8c8c99", maxWidth: 860, lineHeight: 1.35 }}>
            A starter U.S. credit line on day one, then a coached path to premium-card eligibility. For students and newly arrived professionals.
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: "#5c5c68", letterSpacing: 3 }}>
          <span>RESIDENT-ALIEN.COM</span>
          <span>NOT A BANK · NOT AFFILIATED WITH AMEX OR CHASE</span>
        </div>
      </div>
    ),
    size,
  );
}
