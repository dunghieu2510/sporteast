"use client";

import Link from "next/link";
import { useState } from "react";

const pages = [
  { slug: "home", name: "Home Page", url: "/" },
  { slug: "nfl", name: "NFL Category", url: "/sport/nfl" },
  { slug: "nba", name: "NBA Category", url: "/sport/nba" },
  { slug: "nhl", name: "NHL Category", url: "/sport/nhl" },
  { slug: "mlb", name: "MLB Category", url: "/sport/mlb" },
  { slug: "soccer", name: "Soccer Category", url: "/sport/soccer" },
];

export default function AdminMetaTags() {
  const [selected, setSelected] = useState("home");
  const [saved, setSaved] = useState(false);
  const [meta, setMeta] = useState({
    home: {
      title: "Sporteast · Live Sports Schedules & Scores",
      description: "Get live sports schedules, real-time scores, and community livestreams for NFL, NBA, NHL, MLB and more.",
      keywords: ["sports", "live scores", "schedules", "livestreams"],
      canonical: "https://sporteast.com",
      ogTitle: "Sporteast - Live Sports",
      ogDescription: "Your ultimate destination for live sports",
      ogImage: "https://sporteast.com/og-image.jpg",
      robotsIndex: true,
      robotsFollow: true,
    },
  });

  const currentMeta = meta[selected as keyof typeof meta] || {
    title: "",
    description: "",
    keywords: [],
    canonical: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    robotsIndex: true,
    robotsFollow: true,
  };

  const titleLength = currentMeta.title.length;
  const descLength = currentMeta.description.length;
  const titleOk = titleLength >= 30 && titleLength <= 60;
  const descOk = descLength >= 120 && descLength <= 160;

  const handleSave = () => {
    setMeta({
      ...meta,
      [selected]: currentMeta,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const getStatus = (length: number, min: number, max: number) => {
    if (length === 0) return "empty";
    if (length < min || length > max) return "warning";
    return "good";
  };

  return (
    <div className="min-h-screen pt-8">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-8">
          <Link href="/admin/seo" className="mb-4 inline-block text-sm text-neon hover:text-white">
            ← Back to SEO
          </Link>
          <h1 className="font-display text-3xl font-bold text-white">Meta Tags Manager</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
          {/* Page Selector */}
          <div className="glass rounded-2xl p-4 h-fit">
            <h2 className="font-display font-bold text-white mb-4">Pages</h2>
            <div className="flex flex-col gap-2">
              {pages.map((page) => (
                <button
                  key={page.slug}
                  onClick={() => setSelected(page.slug)}
                  className={`text-left rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                    selected === page.slug
                      ? "border border-neon/70 bg-neon/10 text-white"
                      : "border border-white/10 text-white/80 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <p className="text-xs text-muted truncate">{page.url}</p>
                  {page.name}
                </button>
              ))}
            </div>
          </div>

          {/* Meta Editor */}
          <div className="space-y-6">
            {/* Title */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-white/80">
                  Meta Title
                </label>
                <span
                  className={`text-xs font-bold ${
                    titleOk ? "text-green-400" : "text-orange-400"
                  }`}
                >
                  {titleLength}/60 {titleOk ? "✓" : titleLength === 0 ? "?" : "!"}
                </span>
              </div>
              <input
                type="text"
                maxLength={60}
                value={currentMeta.title}
                onChange={(e) =>
                  setMeta({
                    ...meta,
                    [selected]: { ...currentMeta, title: e.target.value },
                  })
                }
                placeholder="Page title for search results"
                className="w-full rounded-lg bg-night-800 px-4 py-2 text-white outline-none placeholder:text-muted focus:ring-2 focus:ring-neon/50"
              />
              <p className="mt-2 text-xs text-muted">
                Optimal length: 30-60 characters
              </p>
            </div>

            {/* Description */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-white/80">
                  Meta Description
                </label>
                <span
                  className={`text-xs font-bold ${
                    descOk ? "text-green-400" : "text-orange-400"
                  }`}
                >
                  {descLength}/160 {descOk ? "✓" : descLength === 0 ? "?" : "!"}
                </span>
              </div>
              <textarea
                maxLength={160}
                value={currentMeta.description}
                onChange={(e) =>
                  setMeta({
                    ...meta,
                    [selected]: { ...currentMeta, description: e.target.value },
                  })
                }
                placeholder="Description shown in search results"
                className="w-full rounded-lg bg-night-800 px-4 py-2 text-white outline-none placeholder:text-muted focus:ring-2 focus:ring-neon/50 resize-none"
                rows={2}
              />
              <p className="mt-2 text-xs text-muted">
                Optimal length: 120-160 characters
              </p>
            </div>

            {/* Keywords */}
            <div className="glass rounded-2xl p-6">
              <label className="block text-sm font-semibold text-white/80 mb-2">
                Keywords (comma separated)
              </label>
              <input
                type="text"
                value={currentMeta.keywords?.join(", ") || ""}
                onChange={(e) =>
                  setMeta({
                    ...meta,
                    [selected]: {
                      ...currentMeta,
                      keywords: e.target.value.split(",").map((k) => k.trim()),
                    },
                  })
                }
                placeholder="e.g., sports, live scores, schedules"
                className="w-full rounded-lg bg-night-800 px-4 py-2 text-white outline-none placeholder:text-muted focus:ring-2 focus:ring-neon/50"
              />
              <p className="mt-2 text-xs text-muted">
                Max 5 keywords recommended
              </p>
            </div>

            {/* Open Graph */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">Open Graph (Social Media)</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/80 mb-1">OG Title</label>
                  <input
                    type="text"
                    value={currentMeta.ogTitle}
                    onChange={(e) =>
                      setMeta({
                        ...meta,
                        [selected]: { ...currentMeta, ogTitle: e.target.value },
                      })
                    }
                    className="w-full rounded-lg bg-night-800 px-4 py-2 text-white outline-none text-sm focus:ring-2 focus:ring-neon/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">OG Description</label>
                  <input
                    type="text"
                    value={currentMeta.ogDescription}
                    onChange={(e) =>
                      setMeta({
                        ...meta,
                        [selected]: { ...currentMeta, ogDescription: e.target.value },
                      })
                    }
                    className="w-full rounded-lg bg-night-800 px-4 py-2 text-white outline-none text-sm focus:ring-2 focus:ring-neon/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-1">OG Image URL</label>
                  <input
                    type="text"
                    value={currentMeta.ogImage}
                    onChange={(e) =>
                      setMeta({
                        ...meta,
                        [selected]: { ...currentMeta, ogImage: e.target.value },
                      })
                    }
                    className="w-full rounded-lg bg-night-800 px-4 py-2 text-white outline-none text-sm focus:ring-2 focus:ring-neon/50"
                  />
                </div>
              </div>
            </div>

            {/* Robots Meta */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">Robots Meta</h3>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentMeta.robotsIndex}
                    onChange={(e) =>
                      setMeta({
                        ...meta,
                        [selected]: { ...currentMeta, robotsIndex: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-white/80">Index (allow search engines)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentMeta.robotsFollow}
                    onChange={(e) =>
                      setMeta({
                        ...meta,
                        [selected]: { ...currentMeta, robotsFollow: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-white/80">Follow (crawl links)</span>
                </label>
              </div>
            </div>

            {/* Save */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleSave}
                className="rounded-lg bg-neon px-6 py-2.5 font-bold text-night-950 transition hover:brightness-110"
              >
                Save Changes
              </button>
              {saved && <span className="text-sm text-green-400">✓ Saved successfully</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
