import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Sporteast — Live Sports Schedules & Scores";

export default function Image() {
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
          backgroundImage: "radial-gradient(circle at 25% 20%, #3a3a3a 0, #222222 60%)",
          color: "#f2f2f2",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 128, fontWeight: 800, letterSpacing: -2 }}>
          <span>SPORT</span>
          <span style={{ color: "#ffd23f" }}>EAST</span>
        </div>
        <div style={{ fontSize: 40, marginTop: 24, color: "#c4c4c4" }}>Live Sports Schedules & Scores</div>
        <div style={{ display: "flex", marginTop: 48, gap: 16, fontSize: 26, color: "#8f8f8f" }}>
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
