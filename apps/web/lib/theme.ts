import { SITE_KEY } from "./api";

/**
 * Per-site palette for the opengraph-image routes, which render via next/og's
 * ImageResponse (plain inline styles — no CSS cascade, so they can't read the
 * CSS custom properties in app/globals.css). Keep these hex values in sync
 * with the matching `[data-site="..."]` block there.
 */
export interface SitePalette {
  bg: string;
  bgGradient: string;
  accent: string;
  muted: string;
  mutedDim: string;
}

const PALETTES: Record<string, SitePalette> = {
  methstreams: { bg: "#222222", bgGradient: "#3a3a3a", accent: "#ffd23f", muted: "#c4c4c4", mutedDim: "#8f8f8f" },
  crackstreamsv2: { bg: "#141a28", bgGradient: "#232d47", accent: "#39e0ff", muted: "#a9bedd", mutedDim: "#6f84ab" },
  crackstreameast: { bg: "#0f1a0f", bgGradient: "#1f351f", accent: "#39ff6a", muted: "#9bcf9f", mutedDim: "#5c8a60" },
};

export const SITE_PALETTE: SitePalette = PALETTES[SITE_KEY] ?? PALETTES.methstreams;
