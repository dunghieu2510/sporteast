import { SITE_NAME } from "@/lib/seo";

/** Pixel sunrise ("east") mark: 16x16 grid, "#" = ink pixel. Keep in sync with app/icon.svg. */
export const LOGO_PIXELS = [
  ".......##.......",
  ".......##.......",
  "..#..........#..",
  "...#........#...",
  "......####......",
  "....########....",
  "...##########...",
  "#.############.#",
  "..############..",
  "..############..",
  "................",
  "################",
  "................",
  "...##########...",
  "................",
  ".....######.....",
];

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      role="img"
      aria-label={SITE_NAME}
      className="shrink-0 bg-neon"
      style={{ boxShadow: "inset 2px 2px 0 0 rgb(255 255 255 / 0.5), inset -2px -2px 0 0 rgb(0 0 0 / 0.25), 0 0 0 2px #141414" }}
    >
      {LOGO_PIXELS.flatMap((row, y) =>
        [...row].map((c, x) => (c === "#" ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#141414" /> : null)),
      )}
    </svg>
  );
}

/** Mark + wordmark: `main` in white and `accent` in the brand yellow. Defaults to SPORT/EAST. */
export function Logo({
  size = 32,
  textClass = "text-lg",
  main = "SPORT",
  accent = "EAST",
}: {
  size?: number;
  textClass?: string;
  main?: string;
  accent?: string;
}) {
  return (
    <span className="flex items-center gap-3">
      <LogoMark size={size} />
      <span className={`font-display font-bold tracking-tight ${textClass}`}>
        {main}
        {accent && <span className="text-neon">{accent}</span>}
      </span>
    </span>
  );
}
