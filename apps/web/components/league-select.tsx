"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { LeagueSummary } from "@arena/types";

/** Dropdown to pick which league the scoreboard strip shows; preserves ?date= on change. */
export function LeagueSelect({ leagues, selected }: { leagues: LeagueSummary[]; selected: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <select
      value={selected}
      onChange={(e) => {
        const qs = new URLSearchParams(searchParams.toString());
        qs.set("league", e.target.value);
        router.push(`?${qs.toString()}`);
      }}
      className="pixel-tag shrink-0 bg-night-700 px-1.5 py-0.5 text-xs font-semibold text-white"
    >
      {leagues.map((l) => (
        <option key={l.slug} value={l.slug}>
          {l.icon ? `${l.icon} ` : ""}
          {l.shortName}
        </option>
      ))}
    </select>
  );
}
