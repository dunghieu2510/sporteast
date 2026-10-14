"use client";

import Link from "next/link";
import { useState } from "react";

const templates = {
  standard: `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/internal

Sitemap: https://sporteast.com/sitemap.xml`,

  blockAll: `User-agent: *
Disallow: /`,

  allowAll: `User-agent: *
Allow: /

Sitemap: https://sporteast.com/sitemap.xml`,

  blockAI: `User-agent: *
Allow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

Sitemap: https://sporteast.com/sitemap.xml`,
};

export default function AdminRobots() {
  const [content, setContent] = useState(templates.standard);
  const [testUrl, setTestUrl] = useState("/sport/nfl");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const testRobots = () => {
    const lines = content.split("\n");
    const disallowRules = lines
      .filter((line) => line.trim().startsWith("Disallow:"))
      .map((line) => line.replace("Disallow:", "").trim());

    const isBlocked = disallowRules.some((rule) => {
      if (rule === "/") return true;
      return testUrl.startsWith(rule);
    });

    setTestResult(isBlocked ? "🚫 BLOCKED" : "✅ ALLOWED");
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen pt-8">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div className="mb-8">
          <Link href="/admin/seo" className="mb-4 inline-block text-sm text-neon hover:text-white">
            ← Back to SEO
          </Link>
          <h1 className="font-display text-3xl font-bold text-white">Robots.txt Editor</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
          {/* Templates */}
          <div className="glass rounded-2xl p-4 h-fit">
            <h2 className="font-display font-bold text-white mb-4">Templates</h2>
            <div className="flex flex-col gap-2">
              {Object.entries(templates).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => setContent(value)}
                  className="rounded-lg px-4 py-2 text-left text-sm font-semibold transition border border-white/10 text-white/80 hover:border-white/20 hover:text-white"
                >
                  {key === "standard" && "📋 Standard"}
                  {key === "blockAll" && "🚫 Block All"}
                  {key === "allowAll" && "✅ Allow All"}
                  {key === "blockAI" && "🤖 Block AI"}
                </button>
              ))}
            </div>
          </div>

          {/* Editor */}
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <h2 className="font-display font-bold text-white mb-4">robots.txt Content</h2>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-64 rounded-lg bg-night-800 p-4 font-mono text-sm text-white outline-none focus:ring-2 focus:ring-neon/50 resize-none"
              />
              <div className="flex items-center gap-4 mt-4">
                <button
                  onClick={handleSave}
                  className="rounded-lg bg-neon px-6 py-2.5 font-bold text-night-950 transition hover:brightness-110"
                >
                  Save
                </button>
                {saved && <span className="text-sm text-green-400">✓ Saved</span>}
              </div>
            </div>

            {/* Test */}
            <div className="glass rounded-2xl p-6">
              <h2 className="font-display font-bold text-white mb-4">Test URL</h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  placeholder="/path/to/test"
                  className="flex-1 rounded-lg bg-night-800 px-4 py-2 text-white outline-none placeholder:text-muted focus:ring-2 focus:ring-neon/50"
                />
                <button
                  onClick={testRobots}
                  className="rounded-lg border border-neon/50 px-6 py-2 font-bold text-neon transition hover:bg-neon/10"
                >
                  Test
                </button>
              </div>
              {testResult && (
                <div className="mt-3 rounded-lg bg-night-800 px-4 py-3 text-sm font-bold">
                  Result for <code className="text-neon">{testUrl}</code>: {testResult}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="glass rounded-2xl p-6">
              <h2 className="font-display font-bold text-white mb-4">📚 robots.txt Info</h2>
              <ul className="space-y-2 text-sm text-white/80">
                <li>
                  <strong>Location:</strong> <code className="text-neon">/robots.txt</code>
                </li>
                <li>
                  <strong>User-agent:</strong> Crawler name (use * for all)
                </li>
                <li>
                  <strong>Disallow:</strong> Paths to block (e.g., /admin)
                </li>
                <li>
                  <strong>Allow:</strong> Paths to allow (overrides Disallow)
                </li>
                <li className="pt-2 border-t border-white/10">
                  ✅ Standard config blocks /admin and /api/internal
                </li>
                <li>
                  ⚠️ robots.txt is advisory — crawlers must respect it
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
