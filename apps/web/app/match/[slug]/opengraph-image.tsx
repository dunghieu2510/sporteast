import { ImageResponse } from "next/og";
import { getMatch, getSettings } from "@/lib/api";
import { SITE_NAME } from "@/lib/seo";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `Match live stream on ${SITE_NAME}`;

type Props = { params: Promise<{ slug: string }> };

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const [{ data }, { data: s }] = await Promise.all([getMatch(slug).catch(() => ({ data: null })), getSettings()]);
  const title = data?.title ?? "Live Stream";
  const league = data?.league.name ?? "Live Sports";
  const main = s?.logoTextMain ?? "SPORT";
  const accent = s?.logoTextAccent ?? "EAST";

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
          background: "#222222",
          backgroundImage: "radial-gradient(circle at 50% 0%, #3a3a3a 0, #222222 65%)",
          color: "#f2f2f2",
          fontFamily: "sans-serif",
          padding: "0 70px",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 6, color: "#ffd23f", fontWeight: 700 }}>
          {league.toUpperCase()} · LIVE STREAM
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 800,
            textAlign: "center",
            marginTop: 28,
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", marginTop: 56, fontSize: 32, fontWeight: 800 }}>
          <span>{main}</span>
          <span style={{ color: "#ffd23f" }}>{accent}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
