import { ImageResponse } from "next/og";
import { getSettings } from "@/lib/api";
import { SITE_NAME } from "@/lib/seo";
import { SITE_PALETTE } from "@/lib/theme";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SITE_NAME} — Live Sports Schedules & Scores`;

export default async function Image() {
  const { data: s } = await getSettings();
  const main = s?.logoTextMain ?? "SPORT";
  const accent = s?.logoTextAccent ?? "EAST";
  const p = SITE_PALETTE;
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: p.bg,
          backgroundImage: `radial-gradient(circle at 25% 20%, ${p.bgGradient} 0, ${p.bg} 60%)`,
          color: "#f2f2f2",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 128, fontWeight: 800, letterSpacing: -2 }}>
          <span>{main}</span>
          <span style={{ color: p.accent }}>{accent}</span>
        </div>
        <div style={{ fontSize: 40, marginTop: 24, color: p.muted }}>Live Sports Schedules & Scores</div>
        <div style={{ display: "flex", marginTop: 48, gap: 16, fontSize: 26, color: p.mutedDim }}>
          <span>NFL</span>
          <span>·</span>
          <span>NBA</span>
          <span>·</span>
          <span>NHL</span>
          <span>·</span>
          <span>MLB</span>
          <span>·</span>
          <span>Soccer</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
