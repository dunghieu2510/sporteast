"use client";

import Link from "next/link";
import { useState } from "react";

const defaultLeagues = [
  { slug: "nfl", name: "NFL", icon: "🏈", color: "#3b82f6" },
  { slug: "nba", name: "NBA", icon: "🏀", color: "#f97316" },
  { slug: "nhl", name: "NHL", icon: "🏒", color: "#22d3ee" },
  { slug: "mlb", name: "MLB", icon: "⚾", color: "#84cc16" },
  { slug: "soccer", name: "Soccer", icon: "⚽", color: "#06b6d4" },
  { slug: "wnba", name: "WNBA", icon: "🏀", color: "#ec4899" },
  { slug: "ncaaf", name: "NCAAF", icon: "🏈", color: "#8b5cf6" },
];

export default function AdminLeagues() {
  const [leagues, setLeagues] = useState(defaultLeagues);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: "", color: "" });

  const handleEdit = (slug: string) => {
    const league = leagues.find((l) => l.slug === slug);
    if (league) {
      setEditingId(slug);
      setEditData({ name: league.name, color: league.color });
    }
  };

  const handleSave = () => {
    if (editingId && editData.name) {
      setLeagues(
        leagues.map((l) =>
          l.slug === editingId ? { ...l, name: editData.name, color: editData.color } : l
        )
      );
      setEditingId(null);
    }
  };

  return (
    <div className="min-h-screen pt-8">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div className="mb-8">
          <Link href="/admin" className="mb-4 inline-block text-sm text-neon hover:text-white">
            ← Back to Dashboard
          </Link>
          <h1 className="font-display text-3xl font-bold text-white">Manage Leagues</h1>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-display font-bold text-white">Leagues ({leagues.length})</h2>
          </div>

          <div className="divide-y divide-white/5">
            {leagues.map((league) => (
              <div
                key={league.slug}
                className="flex items-center justify-between px-6 py-4 hover:bg-night-800/50"
              >
                {editingId === league.slug ? (
                  <div className="flex-1 flex gap-4">
                    <span className="text-2xl">{league.icon}</span>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="mb-2 block w-full rounded-lg bg-night-700 px-3 py-1 text-white outline-none text-sm"
                      />
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted">Color:</label>
                        <input
                          type="color"
                          value={editData.color}
                          onChange={(e) => setEditData({ ...editData, color: e.target.value })}
                          className="h-8 w-12 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-3xl">{league.icon}</span>
                    <div>
                      <p className="font-semibold text-white">{league.name}</p>
                      <p className="text-xs text-muted">{league.slug}</p>
                    </div>
                    <span
                      className="ml-auto w-12 h-8 rounded-lg"
                      style={{ backgroundColor: league.color }}
                    />
                  </div>
                )}

                <div className="flex gap-2 ml-4">
                  {editingId === league.slug ? (
                    <>
                      <button
                        onClick={handleSave}
                        className="rounded-lg border border-neon/50 px-4 py-1.5 text-sm text-neon transition hover:bg-neon/10"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-white/10 px-4 py-1.5 text-sm text-muted transition hover:text-white"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleEdit(league.slug)}
                      className="rounded-lg border border-white/10 px-4 py-1.5 text-sm text-muted transition hover:border-neon/50 hover:text-white"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
