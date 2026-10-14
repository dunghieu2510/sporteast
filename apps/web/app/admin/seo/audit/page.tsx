"use client";

import Link from "next/link";
import { useState } from "react";

interface AuditItem {
  name: string;
  status: "pass" | "warning" | "fail";
  message: string;
  fix?: string;
}

const auditChecklist: Record<string, AuditItem[]> = {
  home: [
    {
      name: "Meta Title Length",
      status: "pass",
      message: "Title is 54 characters (optimal: 30-60)",
    },
    {
      name: "Meta Description",
      status: "pass",
      message: "Description is 145 characters (optimal: 120-160)",
    },
    {
      name: "H1 Tag",
      status: "pass",
      message: "Page has exactly 1 H1 tag",
    },
    {
      name: "Image Alt Text",
      status: "warning",
      message: "5/6 images have alt text (missing 1)",
      fix: "Add alt text to all images for accessibility",
    },
    {
      name: "Internal Links",
      status: "pass",
      message: "15 internal links found",
    },
    {
      name: "Mobile Friendly",
      status: "pass",
      message: "Page is responsive and mobile-friendly",
    },
    {
      name: "Page Speed",
      status: "pass",
      message: "Lighthouse score: 85/100",
    },
    {
      name: "Structured Data",
      status: "pass",
      message: "Valid Schema.org markup found",
    },
    {
      name: "Canonical URL",
      status: "pass",
      message: "Canonical URL is set correctly",
    },
    {
      name: "SSL/HTTPS",
      status: "pass",
      message: "Site uses HTTPS",
    },
    {
      name: "Sitemap",
      status: "pass",
      message: "Page included in sitemap.xml",
    },
    {
      name: "Robots.txt",
      status: "pass",
      message: "Not blocked by robots.txt",
    },
  ],
};

export default function AdminAudit() {
  const [selected, setSelected] = useState("home");
  const [runAudit, setRunAudit] = useState(false);
  const [auditing, setAuditing] = useState(false);

  const audit = auditChecklist[selected] || auditChecklist.home;
  const passing = audit.filter((a) => a.status === "pass").length;
  const warnings = audit.filter((a) => a.status === "warning").length;
  const failing = audit.filter((a) => a.status === "fail").length;
  const score = Math.round((passing / audit.length) * 100);

  const handleRunAudit = () => {
    setAuditing(true);
    setTimeout(() => {
      setAuditing(false);
      setRunAudit(true);
    }, 2000);
  };

  const getStatusIcon = (status: string) => {
    if (status === "pass") return "✅";
    if (status === "warning") return "⚠️";
    return "❌";
  };

  return (
    <div className="min-h-screen pt-8">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div className="mb-8">
          <Link href="/admin/seo" className="mb-4 inline-block text-sm text-neon hover:text-white">
            ← Back to SEO
          </Link>
          <h1 className="font-display text-3xl font-bold text-white">SEO Audit</h1>
        </div>

        {/* Page Selector & Run Audit */}
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="flex-1 rounded-lg bg-night-800 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-neon/50"
            >
              <option value="home">Home Page</option>
              <option value="nfl">NFL Category</option>
              <option value="nba">NBA Category</option>
              <option value="nhl">NHL Category</option>
            </select>
            <button
              onClick={handleRunAudit}
              disabled={auditing}
              className="rounded-lg bg-neon px-6 py-2 font-bold text-night-950 transition hover:brightness-110 disabled:opacity-50"
            >
              {auditing ? "Auditing..." : "Run Audit"}
            </button>
          </div>
        </div>

        {/* Score Card */}
        <div className="grid gap-4 mb-8 sm:grid-cols-4">
          <div className="glass rounded-xl p-6 text-center">
            <div className="text-5xl font-bold text-neon mb-2">{score}</div>
            <p className="text-sm text-muted">SEO Score</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-400 mb-1">{passing}</div>
            <p className="text-xs text-muted">Passing</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-orange-400 mb-1">{warnings}</div>
            <p className="text-xs text-muted">Warnings</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-400 mb-1">{failing}</div>
            <p className="text-xs text-muted">Issues</p>
          </div>
        </div>

        {/* Audit Checklist */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-display font-bold text-white">Audit Checklist</h2>
          </div>

          <div className="divide-y divide-white/5">
            {audit.map((item, i) => (
              <div
                key={i}
                className="px-6 py-4 hover:bg-night-800/30"
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl mt-1 shrink-0">
                    {getStatusIcon(item.status)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-sm text-muted mt-1">{item.message}</p>
                    {item.fix && (
                      <div className="mt-2 rounded-lg bg-night-700 px-3 py-2">
                        <p className="text-xs font-semibold text-orange-300">💡 How to fix:</p>
                        <p className="text-xs text-white/80 mt-1">{item.fix}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-8 glass rounded-2xl p-6">
          <h2 className="font-display font-bold text-white mb-4">Recommendations</h2>
          <ul className="space-y-3 text-sm text-white/80">
            <li className="flex gap-3">
              <span>📝</span>
              <span>Add alt text to remaining images for better accessibility and SEO</span>
            </li>
            <li className="flex gap-3">
              <span>🔗</span>
              <span>Good internal linking structure — maintain at least 2-3 links per page</span>
            </li>
            <li className="flex gap-3">
              <span>⚡</span>
              <span>Page speed is excellent. Keep optimizing images and code splitting</span>
            </li>
            <li className="flex gap-3">
              <span>📊</span>
              <span>Schema markup helps search engines understand your content</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
