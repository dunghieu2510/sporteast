import { ImageResponse } from "next/og";
import { getCategory, getSettings } from "@/lib/api";
import { SITE_NAME } from "@/lib/seo";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `Sports schedule on ${SITE_NAME}`;

type Props = { params: Promise<{ slug: string }> };

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const [{ data }, { data: s }] = await Promise.all([getCategory(slug).catch(() => ({ data: null })), getSettings()]);
  const name = data?.name ?? "Live Sports";
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
        }}
      >
        <div style={{ display: "flex", fontSize: 120, fontWeight: 800, color: "#ffd23f" }}>{name}</div>
        <div style={{ display: "flex", fontSize: 44, marginTop: 20 }}>Schedule &amp; Live Scores</div>
        <div style={{ display: "flex", marginTop: 56, fontSize: 30, fontWeight: 800, color: "#c4c4c4" }}>
          <span style={{ color: "#f2f2f2" }}>{main}</span>
          <span style={{ color: "#ffd23f" }}>{accent}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
