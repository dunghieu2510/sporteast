import { GAME_WINDOW_MS, type MatchDetail, type MatchSummary } from "@arena/types";
import { formatKickoff } from "./format";

export const SITE_NAME = "Methstreams";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

type SeoMatch = Pick<MatchSummary, "title" | "league" | "startTime">;

/** "<match> Live Streams" — same form for every game. */
export const matchSeoTitle = (m: SeoMatch) => `${m.title} Live Streams`;

/** Always contains: match name, league + "streams", and the keyword "streameast". */
export function matchSeoDescription(m: SeoMatch) {
  return (
    `Watch ${m.title} live streams on ${SITE_NAME}. ` +
    `${m.league.name} streams at ${formatKickoff(m.startTime)} — a free streameast alternative.`
  );
}

export const matchSeoKeywords = (m: SeoMatch) => [
  `${m.title} live stream`,
  `${m.title} streams`,
  `${m.league.name} streams`,
  `${m.league.name} live streams`,
  "streameast",
  `streameast ${m.league.name}`,
];

export const matchUrl = (slug: string) => `${SITE_URL}/match/${slug}`;

/** schema.org SportsEvent; every game ends 4h after it starts. */
export function matchJsonLd(m: MatchDetail) {
  const start = new Date(m.startTime);
  const end = new Date(start.getTime() + GAME_WINDOW_MS);
  const venue = m.details?.info.venue;
  const teamLd = (t: { name: string }) => ({ "@type": "SportsTeam", name: t.name, sport: m.league.sport.name });

  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: m.title,
    description: matchSeoDescription(m),
    url: matchUrl(m.slug),
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    eventStatus:
      m.status === "POSTPONED" ? "https://schema.org/EventPostponed" : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    sport: m.league.sport.name,
    location: {
      "@type": "Place",
      name: venue?.name ?? m.venue ?? m.league.name,
      ...((venue?.city || venue?.state) && {
        address: {
          "@type": "PostalAddress",
          ...(venue.city && { addressLocality: venue.city }),
          ...(venue.state && { addressRegion: venue.state }),
        },
      }),
    },
    ...(m.homeTeam && { homeTeam: teamLd(m.homeTeam) }),
    ...(m.awayTeam && { awayTeam: teamLd(m.awayTeam) }),
    ...(m.homeTeam && m.awayTeam && { competitor: [teamLd(m.homeTeam), teamLd(m.awayTeam)] }),
    organizer: { "@type": "Organization", name: m.league.name },
    isAccessibleForFree: true,
    keywords: matchSeoKeywords(m).join(", "),
  };
}

/** Safe to embed in <script>: prevents "</script>" breakouts. */
export const jsonLdString = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
