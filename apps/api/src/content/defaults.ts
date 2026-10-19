const generic = (sport: string) =>
  `Methstreams provides comprehensive ${sport} coverage with instant access to live scores, upcoming game schedules, and detailed match information. ` +
  `Whether you're checking scores during the season, planning watch parties, or analyzing team performance, our platform offers everything ${sport} fans need.`;

export const defaultCategories = [
  {
    slug: "nfl",
    name: "NFL",
    icon: "🏈",
    description: "National Football League schedules, live scores, and play-by-play coverage.",
    contentTitle: "Everything You Need for NFL Football",
    intro:
      "Stay on top of the National Football League with Methstreams. Get live NFL scores, complete game schedules, and real-time updates for all 32 teams across the AFC and NFC.",
  },
  {
    slug: "ncaaf",
    name: "NCAAF",
    icon: "🏈",
    description: "College Football schedules and live game updates.",
    contentTitle: "College Football Schedules & Live Scores",
    intro:
      "Follow your favorite college football teams with Methstreams. Get complete NCAAF schedules, live game scores, and coverage of the best college football matchups.",
  },
  {
    slug: "mlb",
    name: "MLB",
    icon: "⚾",
    description: "Major League Baseball schedules, scores, and standings.",
    contentTitle: "MLB Baseball Games & Live Scores",
    intro:
      "Never miss an MLB game with Methstreams. Track the baseball season with live scores, complete schedules for all 30 teams, and real-time game updates.",
  },
  {
    slug: "nba",
    name: "NBA",
    icon: "🏀",
    description: "NBA Basketball schedules, live scores, and game updates.",
    contentTitle: "NBA Basketball Schedule & Live Scores",
    intro:
      "Get instant NBA scores and complete basketball schedules. Follow your favorite NBA teams with real-time game updates and standings.",
  },
  {
    slug: "soccer",
    name: "Soccer",
    icon: "⚽",
    description: "International and domestic soccer leagues with live scores.",
    contentTitle: "Soccer Leagues & International Football Live Scores",
    intro:
      "Stay updated with international and domestic soccer. Track live scores from major soccer leagues including MLS, Premier League, La Liga, Serie A, Bundesliga, and Ligue 1.",
  },
  {
    slug: "wnba",
    name: "WNBA",
    icon: "🏀",
    description: "Women's Basketball League schedules and live game updates.",
    contentTitle: "WNBA Basketball Schedules & Live Scores",
    intro:
      "Follow women's professional basketball with Methstreams. Get complete WNBA schedules, live game scores, and coverage of the best women's basketball action.",
  },
  {
    slug: "nhl",
    name: "NHL",
    icon: "🏒",
    description: "NHL Ice Hockey schedules, live scores, and season standings.",
    contentTitle: "NHL Hockey Schedule & Live Scores",
    intro:
      "Stay on the ice with Methstreams. Get live NHL scores, complete hockey schedules, and real-time updates for all 32 NHL teams across the season.",
  },
].map(({ intro, ...c }, i) => ({ ...c, sortOrder: i, content: `${intro}\n\n${generic(c.name)}` }));

export const defaultPages = [
  {
    slug: "privacy",
    title: "Privacy Policy",
    content: `## Overview

This Privacy Policy explains what information Methstreams collects when you visit the site and how it is used.

## Information we collect

- Basic usage data such as pages visited, device type and approximate location, collected through standard server logs and analytics.
- Information you send us voluntarily, for example when you contact us by email.

## How we use it

We use this information to operate and improve the site, keep it secure, and understand which sports and games are most popular. We do not sell personal information.

## Cookies

Methstreams may use cookies and similar technologies to remember preferences and measure traffic. You can disable cookies in your browser settings.

## Third-party links

The site may link to third-party websites. We are not responsible for their privacy practices.

## Contact

Questions about this policy? See the Contact Us page.`,
  },
  {
    slug: "terms",
    title: "Terms of Service",
    content: `## Acceptance of terms

By using Methstreams you agree to these Terms of Service. If you do not agree, please do not use the site.

## Use of the site

Methstreams provides sports schedules, scores and game information for informational purposes. You agree not to misuse the site, attempt to disrupt it, or scrape it in a way that harms its performance.

## Content

Schedules and scores are provided as-is and may contain delays or errors. Team names, logos and league names are the property of their respective owners.

## Disclaimer

The site is provided without warranties of any kind. Methstreams is not liable for any loss arising from your use of the information shown.

## Changes

We may update these terms from time to time. Continued use of the site means you accept the updated terms.`,
  },
  {
    slug: "dmca",
    title: "DMCA",
    content: `## Copyright policy

Methstreams respects the intellectual property rights of others and responds to valid notices of alleged copyright infringement under the Digital Millennium Copyright Act (DMCA).

## Filing a notice

To report infringing content, send a written notice that includes:

- Your name, address, phone number and email.
- A description of the copyrighted work you claim has been infringed.
- The exact URL of the material you want removed.
- A statement that you have a good-faith belief the use is not authorized by the owner, its agent or the law.
- A statement, under penalty of perjury, that the information is accurate and that you are the owner or authorized to act for the owner.
- Your physical or electronic signature.

Send notices to **dmca@your-domain.com**.

## Counter-notice

If you believe content was removed by mistake, you may send a counter-notice containing the same identifying details and a statement that you consent to the relevant jurisdiction.

## Repeat infringers

We will terminate access for users who are repeat infringers where appropriate.`,
  },
  {
    slug: "contact",
    title: "Contact Us",
    content: `## Get in touch

We'd love to hear from you.

- General questions and feedback: **contact@your-domain.com**
- Copyright notices: see the DMCA page.
- Partnerships and advertising: **partners@your-domain.com**

We usually reply within two business days.`,
  },
  {
    slug: "about",
    title: "About Us",
    content: `## About Methstreams

Methstreams is a fan-first home for live sports schedules and scores. We bring together NFL, NCAAF, MLB, NBA, MLS, WNBA and NHL games in one clean, fast place so you always know what is on and when it starts.

## What we do

- Daily schedules with start times in US Eastern time.
- Live status updates as games begin and finish.
- Game information and the last five games for each team.

## Our goal

Make following your teams simple, quick and enjoyable on any device.`,
  },
].map((p, i) => ({ ...p, sortOrder: i }));

/** Category shells for a brand-new site: slug/name/icon/order only, so matches map to the right
 *  menu entry — no description/content/SEO text. The admin writes every category's text themselves. */
const categoryShells = () => defaultCategories.map(({ slug, name, icon, sortOrder }) => ({ slug, name, icon, sortOrder }));

/** Starter content for a brand-new site: empty category shells + the static-page templates with "Methstreams" swapped for the given brand. */
export function brandDefaults(brand: string) {
  const pages =
    brand === "Methstreams" ? defaultPages : defaultPages.map((r) => ({ ...r, content: r.content.replace(/Methstreams/g, brand) }));
  return { categories: categoryShells(), pages };
}
