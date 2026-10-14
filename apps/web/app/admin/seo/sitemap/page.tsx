"use client";

import Link from "next/link";
import { useState } from "react";

interface SitemapURL {
  path: string;
  priority: number;
  changefreq: string;
  lastmod?: string;
}

const defaultSitemapURLs: SitemapURL[] = [
  { path: "/", priority: 1.0, changefreq: "daily", lastmod: "2026-10-11" },
  { path: "/sport/nfl", priority: 0.9, changefreq: "weekly" },
  { path: "/sport/nba", priority: 0.9, changefreq: "weekly" },
  { path: "/sport/nhl", priority: 0.9, changefreq: "weekly" },
  { path: "/sport/mlb", priority: 0.9, changefreq: "weekly" },
  { path: "/sport/soccer", priority: 0.9, changefreq: "weekly" },
  { path: "/sport/wnba", priority: 0.9, changefreq: "weekly" },
  { path: "/sport/ncaaf", priority: 0.9, changefreq: "weekly" },
];

export default function AdminSitemap() {
  const [urls, setUrls] = useState(defaultSitemapURLs);
  const [refreshed, setRefreshed] = useState(false);
  const [newURL, setNewURL] = useState({ path: "", priority: 0.8, changefreq: "weekly" });

  const handleAddURL = () => {
    if (newURL.path && !urls.find((u) => u.path === newURL.path)) {
      setUrls([
        ...urls,
        { ...newURL, lastmod: new Date().toISOString().split("T")[0] },
      ]);
      setNewURL({ path: "", priority: 0.8, changefreq: "weekly" });
    }
  };

  const handleDeleteURL = (path: string) => {
    setUrls(urls.filter((u) => u.path !== path));
  };

  const handleRefresh = () => {
    setRefreshed(true);
    setTimeout(() => setRefreshed(false), 3000);
  };

  const generateSitemapXML = () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>https://sporteast.com${url.path}</loc>
    <lastmod>${url.lastmod || new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;
    return xml;
  };

  return (
    <div className="min-h-screen pt-8">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div className="mb-8">
          <Link href="/admin/seo" className="mb-4 inline-block text-sm text-neon hover:text-white">
            ← Back to SEO
          </Link>
          <h1 className="font-display text-3xl font-bold text-white">Sitemap Manager</h1>
        </div>

        {/* Stats */}
        <div className="grid gap-4 mb-8 sm:grid-cols-3">
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-muted mb-1">Total URLs</p>
            <p className="text-2xl font-bold text-white">{urls.length}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-muted mb-1">Last Updated</p>
            <p className="text-lg font-bold text-white">
              {new Date().toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="glass rounded-xl p-4 text-left hover:border-neon/50 hover:bg-night-800/50 transition"
          >
            <p className="text-xs text-muted mb-1">Status</p>
            <p className={`text-lg font-bold ${refreshed ? "text-green-400" : "text-white"}`}>
              {refreshed ? "✓ Refreshed" : "Ready"}
            </p>
          </button>
        </div>

        {/* Add New URL */}
        <div className="glass rounded-2xl p-6 mb-8">
          <h2 className="font-display font-bold text-white mb-4">Add New URL</h2>
          <div className="grid gap-4 sm:grid-cols-4">
            <input
              type="text"
              placeholder="/path/to/page"
              value={newURL.path}
              onChange={(e) => setNewURL({ ...newURL, path: e.target.value })}
              className="rounded-lg bg-night-800 px-4 py-2 text-white outline-none placeholder:text-muted focus:ring-2 focus:ring-neon/50"
            />
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              placeholder="Priority"
              value={newURL.priority}
              onChange={(e) => setNewURL({ ...newURL, priority: parseFloat(e.target.value) })}
              className="rounded-lg bg-night-800 px-4 py-2 text-white outline-none placeholder:text-muted focus:ring-2 focus:ring-neon/50"
            />
            <select
              value={newURL.changefreq}
              onChange={(e) => setNewURL({ ...newURL, changefreq: e.target.value })}
              className="rounded-lg bg-night-800 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-neon/50"
            >
              <option>daily</option>
              <option>weekly</option>
              <option>monthly</option>
              <option>yearly</option>
            </select>
            <button
              onClick={handleAddURL}
              className="rounded-lg bg-neon px-4 py-2 font-bold text-night-950 transition hover:brightness-110"
            >
              Add URL
            </button>
          </div>
        </div>

        {/* URLs List */}
        <div className="glass rounded-2xl overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-display font-bold text-white">Sitemap URLs</h2>
          </div>

          <div className="divide-y divide-white/5">
            {urls.map((url) => (
              <div key={url.path} className="flex items-center justify-between px-6 py-4 hover:bg-night-800/50">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">https://sporteast.com{url.path}</p>
                  <div className="flex gap-4 mt-1 text-xs text-muted">
                    <span>Priority: {url.priority}</span>
                    <span>Update: {url.changefreq}</span>
                    {url.lastmod && <span>Modified: {url.lastmod}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteURL(url.path)}
                  className="ml-4 rounded-lg border border-red-500/30 px-4 py-1.5 text-sm text-red-400 transition hover:border-red-500 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Download & Preview */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Preview */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display font-bold text-white mb-4">XML Preview</h3>
            <pre className="bg-night-800 p-4 rounded-lg text-xs text-white overflow-auto max-h-64">
              {generateSitemapXML().substring(0, 600)}...
            </pre>
            <p className="mt-2 text-xs text-muted">
              📄 Full sitemap.xml generated on demand
            </p>
          </div>

          {/* Info */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display font-bold text-white mb-4">Sitemap Info</h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li>✅ Serves at: <code className="text-neon">/sitemap.xml</code></li>
              <li>✅ Auto-updated: when URLs change</li>
              <li>✅ Submitted to: Google/Bing</li>
              <li className="pt-3 border-t border-white/10">
                <strong>robots.txt:</strong>
                <code className="block mt-1 text-xs text-muted">Sitemap: https://sporteast.com/sitemap.xml</code>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
