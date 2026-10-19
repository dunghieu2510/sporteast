import type { LastFiveGame, MatchDetail, TeamSummary } from "@arena/types";
import { SITE_KEY } from "./api";
import { SITE_NAME } from "./seo";

export type Form = { wins: number; losses: number; draws: number; record: string; last: LastFiveGame };

export interface PreviewFacts {
  match: MatchDetail;
  home: TeamSummary;
  away: TeamSummary;
  day: string;
  time: string;
  venue: string | null;
  place: string;
  homeForm: Form | null;
  awayForm: Form | null;
  lastGameText: (g: LastFiveGame) => string;
}

export interface PreviewCopy {
  heading: string;
  paragraphs: string[];
  closingLead: string;
  closingTail: string;
}

const fmtAttendance = (n: number) => n.toLocaleString("en-US");

/**
 * Each site has its own sentence structure and vocabulary for this template — not just a brand-name
 * swap — so the same underlying facts (teams, time, venue, broadcasts, recent form) don't read as
 * duplicate content across methstreams / crackstreamsv2 / crackstreameast.
 */
function methstreamsVoice(f: PreviewFacts): PreviewCopy {
  const { match, home, away, day, time, venue, place, homeForm, awayForm, lastGameText } = f;
  const verb = match.status === "FINISHED" ? "faced" : match.status === "LIVE" ? "are facing" : "face";
  const paragraphs: string[] = [];

  paragraphs.push(
    `${away.name} ${verb} ${home.name} in ${match.league.name} action on ${day} at ${time}` +
      `${venue ? `, at ${venue}${place ? ` in ${place}` : ""}` : ""}. ` +
      `Follow this page for ${match.title} live streams, the start time and full game information on ${SITE_NAME}, a free streameast alternative.`,
  );

  if (match.status === "FINISHED" && match.homeScore + match.awayScore > 0) {
    paragraphs.push(`Final score: ${home.name} ${match.homeScore}, ${away.name} ${match.awayScore}.`);
  }

  const info = match.details?.info;
  const where: string[] = [];
  if (info?.broadcasts.length) where.push(`The game is broadcast on ${info.broadcasts.join(", ")}.`);
  if (info?.attendance) where.push(`Attendance was ${fmtAttendance(info.attendance)}.`);
  if (info?.officials.length) where.push(`Officials: ${info.officials.map((o) => o.name).join(", ")}.`);
  if (where.length) paragraphs.push(where.join(" "));

  const formLine = (team: TeamSummary, form: Form | null) =>
    form ? `${team.name} are ${form.record} over their last five games, most recently ${lastGameText(form.last)}.` : null;
  const formLines = [formLine(away, awayForm), formLine(home, homeForm)].filter(Boolean) as string[];
  if (formLines.length) paragraphs.push(`Recent form: ${formLines.join(" ")}`);

  if (homeForm && awayForm) {
    paragraphs.push(
      homeForm.wins === awayForm.wins
        ? `Both teams arrive with ${homeForm.wins} ${homeForm.wins === 1 ? "win" : "wins"} in their last five, so recent form is even.`
        : `${homeForm.wins > awayForm.wins ? home.name : away.name} enter with the stronger recent form, ` +
            `${Math.max(homeForm.wins, awayForm.wins)} wins in their last five against ${Math.min(homeForm.wins, awayForm.wins)} for ${
              homeForm.wins > awayForm.wins ? away.name : home.name
            }.`,
    );
  }

  return {
    heading: `${match.title} Live Stream: Game Preview`,
    paragraphs,
    closingLead: `Bookmark this page and check back for the live status of ${match.title}. You can also browse the full`,
    closingTail: ` for every game on today's slate.`,
  };
}

function crackstreamsv2Voice(f: PreviewFacts): PreviewCopy {
  const { match, home, away, day, time, venue, place, homeForm, awayForm, lastGameText } = f;
  const verb = match.status === "FINISHED" ? "hosted" : match.status === "LIVE" ? "are hosting" : "host";
  const paragraphs: string[] = [];

  paragraphs.push(
    `${home.name} ${verb} ${away.name} in a ${match.league.name} matchup on ${day}, kicking off at ${time}` +
      `${venue ? ` from ${venue}${place ? ` in ${place}` : ""}` : ""}. ` +
      `Catch every minute of ${match.title} right here on ${SITE_NAME}, your streameast alternative built for fans who want more than just a scoreboard.`,
  );

  if (match.status === "FINISHED" && match.homeScore + match.awayScore > 0) {
    paragraphs.push(`Full-time score: ${home.name} ${match.homeScore}, ${away.name} ${match.awayScore}.`);
  }

  const info = match.details?.info;
  const where: string[] = [];
  if (info?.broadcasts.length) where.push(`Tune in via ${info.broadcasts.join(", ")} if you'd rather watch on TV.`);
  if (info?.attendance) where.push(`Attendance tally: ${fmtAttendance(info.attendance)} fans in the building.`);
  if (info?.officials.length) where.push(`On the officiating crew: ${info.officials.map((o) => o.name).join(", ")}.`);
  if (where.length) paragraphs.push(where.join(" "));

  const formLine = (team: TeamSummary, form: Form | null) =>
    form ? `${team.name} sit at ${form.record} across their last five outings, most recently ${lastGameText(form.last)}.` : null;
  const formLines = [formLine(away, awayForm), formLine(home, homeForm)].filter(Boolean) as string[];
  if (formLines.length) paragraphs.push(`Form guide — ${formLines.join(" ")}`);

  if (homeForm && awayForm) {
    paragraphs.push(
      homeForm.wins === awayForm.wins
        ? `Form is a wash here: both sides have picked up ${homeForm.wins} ${homeForm.wins === 1 ? "win" : "wins"} apiece in their last five starts.`
        : `${homeForm.wins > awayForm.wins ? home.name : away.name} carry the form edge into this one — ` +
            `${Math.max(homeForm.wins, awayForm.wins)} wins from their last five compared to ${Math.min(homeForm.wins, awayForm.wins)} for ${
              homeForm.wins > awayForm.wins ? away.name : home.name
            }.`,
    );
  }

  return {
    heading: `${match.title}: Matchup Breakdown & Live Stream Guide`,
    paragraphs,
    closingLead: `Save this page for the ${match.title} live stream and real-time score updates. Need more? The full`,
    closingTail: ` has every kickoff for today.`,
  };
}

function crackstreameastVoice(f: PreviewFacts): PreviewCopy {
  const { match, home, away, day, time, venue, place, homeForm, awayForm, lastGameText } = f;
  const verb = match.status === "FINISHED" ? "took on" : match.status === "LIVE" ? "are taking on" : "travel to face";
  const paragraphs: string[] = [];

  paragraphs.push(
    `${away.name} ${verb} ${home.name} in ${match.league.name} play on ${day} at ${time}` +
      `${venue ? `. The venue: ${venue}${place ? `, ${place}` : ""}` : ""}. ` +
      `Everything you need for ${match.title} — stream links, kickoff time, full game details — lives right here on ${SITE_NAME}.`,
  );

  if (match.status === "FINISHED" && match.homeScore + match.awayScore > 0) {
    paragraphs.push(`It finished ${home.name} ${match.homeScore} — ${away.name} ${match.awayScore}.`);
  }

  const info = match.details?.info;
  const where: string[] = [];
  if (info?.broadcasts.length) where.push(`Watching on TV? Find it on ${info.broadcasts.join(", ")}.`);
  if (info?.attendance) where.push(`Crowd size: ${fmtAttendance(info.attendance)}.`);
  if (info?.officials.length) where.push(`Working the game: ${info.officials.map((o) => o.name).join(", ")}.`);
  if (where.length) paragraphs.push(where.join(" "));

  const formLine = (team: TeamSummary, form: Form | null) =>
    form ? `${team.name}: ${form.record} in their last five, last time out it was ${lastGameText(form.last)}.` : null;
  const formLines = [formLine(away, awayForm), formLine(home, homeForm)].filter(Boolean) as string[];
  if (formLines.length) paragraphs.push(`How are both sides trending? ${formLines.join(" ")}`);

  if (homeForm && awayForm) {
    paragraphs.push(
      homeForm.wins === awayForm.wins
        ? `Nobody's pulling ahead on form — it's ${homeForm.wins} ${homeForm.wins === 1 ? "win" : "wins"} each across the last five for both teams.`
        : `Edge in form goes to ${homeForm.wins > awayForm.wins ? home.name : away.name}, who've won ` +
            `${Math.max(homeForm.wins, awayForm.wins)} of their last five versus ${Math.min(homeForm.wins, awayForm.wins)} for ${
              homeForm.wins > awayForm.wins ? away.name : home.name
            }.`,
    );
  }

  return {
    heading: `${match.title} — Live Stream & Game Day Info`,
    paragraphs,
    closingLead: `Keep this tab open for live ${match.title} updates, or jump to the complete`,
    closingTail: ` to see what else is on today.`,
  };
}

export function buildMatchPreview(f: PreviewFacts): PreviewCopy {
  if (SITE_KEY === "crackstreamsv2") return crackstreamsv2Voice(f);
  if (SITE_KEY === "crackstreameast") return crackstreameastVoice(f);
  return methstreamsVoice(f);
}
