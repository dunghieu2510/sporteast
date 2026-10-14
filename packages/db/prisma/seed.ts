import { PrismaClient } from "@prisma/client";
import { fixtureLeagues, fixtureMatches, fixtureTeams, fixtureTitle } from "@arena/types";

const prisma = new PrismaClient();

const minutesFromNow = (m: number) => new Date(Date.now() + m * 60_000);

async function main() {
  const leagueIds: Record<string, string> = {};
  for (const l of fixtureLeagues) {
    const sport = await prisma.sport.upsert({
      where: { slug: l.sport.slug },
      update: {},
      create: { slug: l.sport.slug, name: l.sport.name, icon: l.icon },
    });
    const data = { name: l.name, shortName: l.shortName, color: l.color, icon: l.icon, sportId: sport.id };
    const league = await prisma.league.upsert({ where: { slug: l.slug }, update: data, create: { slug: l.slug, ...data } });
    leagueIds[l.slug] = league.id;
  }

  const teamIds: Record<string, string> = {};
  for (const { league, ...t } of fixtureTeams) {
    const data = { ...t, leagueId: leagueIds[league] };
    const team = await prisma.team.upsert({ where: { slug: t.slug }, update: data, create: data });
    teamIds[t.slug] = team.id;
  }

  const creator = await prisma.user.upsert({
    where: { email: "creator@arena.local" },
    update: {},
    create: { email: "creator@arena.local", username: "playbyplay", role: "CREATOR" },
  });
  const channel = await prisma.channel.upsert({
    where: { handle: "playbyplay" },
    update: {},
    create: { ownerId: creator.id, handle: "playbyplay", title: "Play-by-Play Live", isVerified: true },
  });

  for (const m of fixtureMatches) {
    // Re-seeding refreshes times/scores so the demo schedule always looks current.
    const data = {
      title: fixtureTitle(m),
      leagueId: leagueIds[m.league],
      homeTeamId: m.home ? teamIds[m.home] : null,
      awayTeamId: m.away ? teamIds[m.away] : null,
      startTime: minutesFromNow(m.startOffsetMin),
      status: m.status,
      homeScore: m.homeScore ?? 0,
      awayScore: m.awayScore ?? 0,
      period: m.period ?? null,
      clock: m.clock ?? null,
      venue: m.venue ?? null,
    };
    const match = await prisma.match.upsert({ where: { slug: m.slug }, update: data, create: { slug: m.slug, ...data } });

    await prisma.matchEvent.deleteMany({ where: { matchId: match.id } });
    if (m.events?.length) {
      // Explicit, increasing createdAt keeps the timeline in order.
      const base = Date.now() - m.events.length * 1000;
      await prisma.matchEvent.createMany({
        data: m.events.map((e, i) => ({
          matchId: match.id,
          teamId: e.side === "home" ? data.homeTeamId : e.side === "away" ? data.awayTeamId : null,
          type: e.type,
          period: e.period,
          clock: e.clock,
          detail: e.detail,
          createdAt: new Date(base + i * 1000),
        })),
      });
    }

    if (m.stream && !(await prisma.stream.findFirst({ where: { channelId: channel.id, matchId: match.id } }))) {
      await prisma.stream.create({
        data: {
          channelId: channel.id,
          matchId: match.id,
          title: m.stream.title,
          status: "LIVE",
          contentSource: "UGC",
          viewerPeak: m.stream.viewerPeak,
          startedAt: minutesFromNow(m.startOffsetMin),
        },
      });
    }
  }

  console.log(`✅ Seeded ${fixtureLeagues.length} leagues, ${fixtureTeams.length} teams, ${fixtureMatches.length} games`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
