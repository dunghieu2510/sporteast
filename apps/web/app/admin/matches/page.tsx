"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { effectiveStatus, type MatchStatus } from "@arena/types";
import { adminFetch } from "@/lib/admin-api";
import { AdminGate, inputCls } from "@/components/admin-ui";

type Row = {
  id: string;
  slug: string;
  title: string;
  startTime: string;
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
  venue: string | null;
  externalId: string | null;
  _count: { embeds: number };
  league: { slug: string; name: string; color: string; icon: string | null };
  homeTeam: { name: string; shortName: string } | null;
  awayTeam: { name: string; shortName: string } | null;
};
type DayResponse = { date: string; today: string; matches: Row[] };

const timeFmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });

const statusStyle: Record<MatchStatus, string> = {
  LIVE: "bg-live text-white",
  SCHEDULED: "bg-night-950 text-muted",
  FINISHED: "bg-night-600 text-white",
  POSTPONED: "bg-neon text-night-950",
};

export default function AdminMatches() {
  return (
    <div className="min-h-screen pt-8">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-8">
          <Link href="/admin" className="mb-4 inline-block text-sm text-neon hover:text-white">
            ← Back to Dashboard
          </Link>
          <h1 className="font-display text-3xl font-bold text-white">Matches</h1>
        </div>
        <AdminGate>
          <DayList />
        </AdminGate>
      </div>
    </div>
  );
}

function DayList() {
  const [date, setDate] = useState<string>("");
  const [data, setData] = useState<DayResponse | null>(null);
  const [league, setLeague] = useState("all");
  const [status, setStatus] = useState<"all" | MatchStatus>("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async (d: string) => {
    try {
      setData(await adminFetch<DayResponse>(`/matches${d ? `?date=${d}` : ""}`));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void load(date);
    const id = setInterval(() => {
      setNow(Date.now());
      void load(date);
    }, 60_000);
    return () => clearInterval(id);
  }, [date, load]);

  const rows = useMemo(
    () => (data?.matches ?? []).map((m) => ({ ...m, status: effectiveStatus(m, now) })),
    [data, now],
  );
  const leagues = useMemo(() => [...new Map(rows.map((m) => [m.league.slug, m.league])).values()], [rows]);

  const visible = rows.filter((m) => {
    if (league !== "all" && m.league.slug !== league) return false;
    if (status !== "all" && m.status !== status) return false;
    return !query || m.title.toLowerCase().includes(query.toLowerCase());
  });

  const count = (s: MatchStatus) => rows.filter((m) => m.status === s).length;
  const shown = data?.date ?? date;

  return (
    <div className="space-y-6">
      <div className="glass flex flex-wrap items-end gap-4 p-4">
        <label className="text-sm font-semibold text-white/80">
          Date (US Eastern)
          <input
            type="date"
            value={date || data?.date || ""}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block bg-night-800 px-3 py-2 text-white"
          />
        </label>
        <button onClick={() => setDate("")} className="pixel-btn px-4 py-2 text-sm font-semibold text-white">
          Today
        </button>
        <button onClick={() => load(date)} className="pixel-btn px-4 py-2 text-sm font-semibold text-white">
          Refresh
        </button>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search match…"
          className={`${inputCls} max-w-xs`}
        />
        <select value={league} onChange={(e) => setLeague(e.target.value)} className="bg-night-800 px-3 py-2 text-white">
          <option value="all">All leagues</option>
          {leagues.map((l) => (
            <option key={l.slug} value={l.slug}>
              {l.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="bg-night-800 px-3 py-2 text-white"
        >
          <option value="all">All statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="LIVE">Live</option>
          <option value="FINISHED">Finished</option>
          <option value="POSTPONED">Postponed</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Total", rows.length],
          ["Scheduled", count("SCHEDULED")],
          ["Live", count("LIVE")],
          ["Finished", count("FINISHED")],
        ].map(([label, n]) => (
          <div key={label} className="glass p-4">
            <p className="mb-1 text-xs text-muted">{label}</p>
            <p className="font-display text-2xl font-bold text-white">{n}</p>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-live">✗ {error}</p>}

      <div className="glass overflow-hidden">
        <div className="border-b-2 border-white/10 px-6 py-4">
          <h2 className="font-display font-bold text-white">
            {shown} · {visible.length} {visible.length === 1 ? "match" : "matches"}
            {data && shown === data.today && <span className="ml-2 text-xs text-neon">TODAY</span>}
          </h2>
        </div>

        {visible.length === 0 ? (
          <p className="px-6 py-10 text-center text-muted">{data ? "No matches for this day." : "Loading…"}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="px-6 py-3">Time (ET)</th>
                  <th className="px-3 py-3">League</th>
                  <th className="px-3 py-3">Match</th>
                  <th className="px-3 py-3">Score</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Venue</th>
                  <th className="px-6 py-3">Embeds</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((m) => (
                  <Fragment key={m.id}>
                  <tr className="border-t-2 border-white/5 hover:bg-night-700">
                    <td className="tabular whitespace-nowrap px-6 py-3">{timeFmt.format(new Date(m.startTime))}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-2 font-display text-xs font-bold">
                        <span className="h-4 w-1.5" style={{ background: m.league.color }} />
                        {m.league.name}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Link href={`/match/${m.slug}`} target="_blank" className="font-semibold text-white hover:text-neon">
                        {m.title}
                      </Link>
                    </td>
                    <td className="tabular whitespace-nowrap px-3 py-3">
                      {m.status === "SCHEDULED" ? "–" : `${m.homeScore} : ${m.awayScore}`}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`pixel-tag inline-block px-2 py-0.5 text-[11px] font-bold ${statusStyle[m.status]}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-muted">{m.venue ?? "—"}</td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => setOpen(open === m.id ? null : m.id)}
                        className={`px-3 py-1 text-xs font-bold ${open === m.id ? "bg-neon text-night-950" : "pixel-btn text-white"}`}
                      >
                        {m._count.embeds} {m._count.embeds === 1 ? "link" : "links"} ▾
                      </button>
                    </td>
                  </tr>
                  {open === m.id && (
                    <tr className="bg-night-900">
                      <td colSpan={7} className="px-6 py-5">
                        <EmbedManager matchId={m.id} title={m.title} onChanged={() => load(date)} />
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

type Embed = { id: string; title: string; url: string; active: boolean; sortOrder: number };

function EmbedManager({ matchId, title, onChanged }: { matchId: string; title: string; onChanged: () => void }) {
  const [items, setItems] = useState<Embed[] | null>(null);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<{ id: string; title: string; url: string } | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const load = useCallback(async () => {
    setItems(await adminFetch<Embed[]>(`/matches/${matchId}/embeds`));
  }, [matchId]);

  useEffect(() => {
    load().catch((e) => setMsg({ ok: false, text: e.message }));
  }, [load]);

  const run = async (fn: () => Promise<void>, okText: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      await load();
      onChanged();
      setMsg({ ok: true, text: okText });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const add = () =>
    run(async () => {
      await adminFetch(`/matches/${matchId}/embeds`, { method: "POST", body: JSON.stringify({ title: label, url }) });
      setLabel("");
      setUrl("");
    }, "Embed added.");

  return (
    <div className="space-y-4">
      <h3 className="font-display text-sm font-bold text-white">Embed links · {title}</h3>

      {items === null ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted">No embed yet. Add one below; the match page will show it as the player.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((e) =>
            editing?.id === e.id ? (
              <li key={e.id} className="grid gap-3 bg-night-800 p-3 sm:grid-cols-[180px_1fr_auto_auto]">
                <input
                  value={editing.title}
                  onChange={(ev) => setEditing({ ...editing, title: ev.target.value })}
                  placeholder="Name"
                  className={inputCls}
                />
                <input
                  value={editing.url}
                  onChange={(ev) => setEditing({ ...editing, url: ev.target.value })}
                  placeholder="https://… or paste <iframe …> code"
                  className={inputCls}
                />
                <button
                  disabled={busy || !editing.url.trim()}
                  onClick={() =>
                    run(
                      () =>
                        adminFetch(`/embeds/${e.id}`, {
                          method: "PUT",
                          body: JSON.stringify({ title: editing.title, url: editing.url }),
                        }).then(() => setEditing(null)),
                      "Embed updated.",
                    )
                  }
                  className="bg-neon px-4 py-2 text-xs font-bold text-night-950 hover:brightness-110 disabled:opacity-50"
                >
                  Save
                </button>
                <button onClick={() => setEditing(null)} className="pixel-btn px-4 py-2 text-xs font-bold text-white">
                  Cancel
                </button>
              </li>
            ) : (
            <li key={e.id} className="flex flex-wrap items-center gap-3 bg-night-800 px-3 py-2">
              <span className="w-32 shrink-0 truncate font-semibold text-white">{e.title}</span>
              <span className="min-w-0 flex-1 truncate text-xs text-muted" title={e.url}>
                {e.url}
              </span>
              <label className="flex items-center gap-1 text-xs text-white/80">
                <input
                  type="checkbox"
                  checked={e.active}
                  disabled={busy}
                  onChange={(ev) =>
                    run(() => adminFetch(`/embeds/${e.id}`, { method: "PUT", body: JSON.stringify({ active: ev.target.checked }) }).then(() => undefined), "Updated.")
                  }
                  className="size-4 accent-[#ffd23f]"
                />
                Show
              </label>
              <button
                disabled={busy}
                onClick={() => setEditing({ id: e.id, title: e.title, url: e.url })}
                className="pixel-btn px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
              >
                Edit
              </button>
              {confirming === e.id ? (
                <span className="flex items-center gap-2 text-xs">
                  <span className="text-white/80">Delete?</span>
                  <button
                    disabled={busy}
                    onClick={() =>
                      run(
                        () => adminFetch(`/embeds/${e.id}`, { method: "DELETE" }).then(() => setConfirming(null)),
                        "Embed deleted.",
                      )
                    }
                    className="bg-live px-3 py-1 font-bold text-white disabled:opacity-50"
                  >
                    Yes
                  </button>
                  <button onClick={() => setConfirming(null)} className="pixel-btn px-3 py-1 font-bold text-white">
                    No
                  </button>
                </span>
              ) : (
                <button
                  disabled={busy}
                  onClick={() => setConfirming(e.id)}
                  className="pixel-btn px-3 py-1 text-xs font-bold text-live disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </li>
            ),
          )}
        </ul>
      )}

      <div className="grid gap-3 sm:grid-cols-[180px_1fr_auto]">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Name (e.g. Source 1)" className={inputCls} />
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… or paste <iframe …> code" className={inputCls} />
        <button onClick={add} disabled={busy || !url.trim()} className="bg-neon px-5 py-2 text-sm font-bold text-night-950 hover:brightness-110 disabled:opacity-50">
          + Add embed
        </button>
      </div>
      {msg && <p className={`text-sm ${msg.ok ? "text-green-400" : "text-live"}`}>{msg.ok ? "✓ " : "✗ "}{msg.text}</p>}
    </div>
  );
}