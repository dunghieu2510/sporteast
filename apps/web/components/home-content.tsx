import Link from "next/link";
import { getCategories } from "@/lib/api";

export async function HomeContent() {
  const { data } = await getCategories();
  const categories = data ?? [];

  return (
    <section className="space-y-8 py-12 text-white/90">
      <article className="space-y-6">
        <h2 className="font-display text-2xl font-bold text-white">
          Your Ultimate Destination for Live Sports Schedules & Scores
        </h2>

        <p className="leading-relaxed">
          Welcome to Methstreams, your one-stop platform for live sports schedules, real-time scores, and community livestreams.
          Whether you're a passionate fan of NFL football, NBA basketball, NHL hockey, MLB baseball, or international soccer,
          Methstreams brings all the action directly to your screen. Our comprehensive sports platform aggregates games from the most
          popular leagues including the NFL, NBA, NHL, MLB, WNBA, NCAAF, and world soccer competitions, ensuring you never miss
          a game.
        </p>

        <p className="leading-relaxed">
          <strong>Real-Time Game Schedules & Live Scores</strong> — Stay updated with our constantly refreshed schedule that displays
          upcoming games across all major sports leagues. View detailed match information including kickoff times, venues, and current
          scores as games unfold in real-time. Our intuitive interface allows you to filter by sport, league, or team, making it easy
          to find the games you care about most.
        </p>

        <p className="leading-relaxed">
          <strong>Community Livestreams & Watch Parties</strong> — Methstreams isn't just about scores and statistics. Our platform empowers
          fans to create and share their own livestreams, watch parties, and play-by-play commentary for games they love. Whether you're
          hosting an analysis of the latest NFL playoff matchup, streaming a live reaction to an NBA Finals game, or organizing a watch
          party for international soccer tournaments, Methstreams provides the tools and community to enhance your sports viewing experience.
        </p>

        <p className="leading-relaxed">
          <strong>Multi-Sport Coverage</strong> — We cover everything from American football and basketball to ice hockey, baseball, soccer,
          and beyond. Filter games by your favorite leagues: NFL, NBA, NHL, MLB, WNBA, NCAAF, MMA, and international soccer. Get live updates,
          final scores, game statistics, and comprehensive play-by-play information for all major sports events.
        </p>

        <p className="leading-relaxed">
          <strong>Smart Game Search & Filters</strong> — Find your favorite team's next game in seconds with our powerful search functionality.
          Filter by league, team, or time frame to create a personalized schedule. Never wonder when your team plays next—Methstreams keeps you informed
          about upcoming matchups, game times, and locations.
        </p>

        <p className="leading-relaxed">
          <strong>Why Choose Methstreams?</strong> Methstreams combines the best features of a sports schedule app with the community engagement of a social
          streaming platform. Unlike traditional sports apps that only provide scores and statistics, Methstreams creates a vibrant community where fans
          can connect, discuss games, share insights, and watch together in real-time. Our platform supports all major sports and leagues, giving you
          one unified destination instead of juggling multiple apps.
        </p>

        <p className="leading-relaxed">
          Whether you're checking live NFL scores during Sunday football season, tracking NBA standings in real-time, following your favorite hockey
          team's playoff run, or keeping up with international soccer matches, Methstreams delivers comprehensive sports information with a fan-first approach.
          Join thousands of sports enthusiasts who trust Methstreams for their daily dose of live sports action, schedules, and community interaction.
        </p>
      </article>

      <div className="border-t-4 border-dotted border-white/15 pt-8">
        <h3 className="font-display text-xl font-bold text-white">Browse Sports Schedules</h3>
        <p className="mb-6 mt-2 text-sm text-muted">
          Pick a league to see today&apos;s games, start times in US Eastern time and live status.
        </p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/sport/${c.slug}`}
              title={`${c.name} schedule and live scores`}
              className="pixel-btn group flex h-full flex-col gap-3 p-5"
            >
              <div className="flex items-center gap-3">
                <span className="pixel-tag grid size-11 shrink-0 place-items-center bg-night-950 text-2xl">{c.icon}</span>
                <span className="font-display text-lg font-bold text-white group-hover:text-neon">{c.name}</span>
              </div>
              <p className="flex-1 text-sm leading-relaxed text-white/75">
                {c.description ?? `${c.name} schedules, live scores and game updates.`}
              </p>
              <span className="font-display text-xs font-bold tracking-wider text-neon">
                VIEW {c.name} SCHEDULE <span className="inline-block transition-none group-hover:translate-x-1">▸</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
