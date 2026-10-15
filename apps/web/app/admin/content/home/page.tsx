"use client";

import Link from "next/link";
import { useState } from "react";

export default function AdminHomeContent() {
  const [content, setContent] = useState({
    mainHeading: "Your Ultimate Destination for Live Sports Schedules & Scores",
    description:
      "Welcome to Methstreams, your one-stop platform for live sports schedules, real-time scores, and community livestreams.",
    featuredSection: `Discover the world of sports with Methstreams. Whether you're a fan of NFL football, NBA basketball, NHL hockey, or international soccer, we bring all the action to your screen with live scores, complete schedules, and community-powered livestreams.`,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen pt-8">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <div className="mb-8">
          <Link href="/admin/content" className="mb-4 inline-block text-sm text-neon hover:text-white">
            ← Back to Content
          </Link>
          <h1 className="font-display text-3xl font-bold text-white">Edit Home Page Content</h1>
        </div>

        <div className="glass rounded-2xl p-8 space-y-6">
          {/* Main Heading */}
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-2">
              Main Heading
            </label>
            <textarea
              value={content.mainHeading}
              onChange={(e) => setContent({ ...content, mainHeading: e.target.value })}
              className="w-full rounded-lg bg-night-800 px-4 py-3 text-white outline-none placeholder:text-muted focus:ring-2 focus:ring-neon/50 resize-none"
              rows={2}
            />
            <p className="mt-1 text-xs text-muted">
              This is the main H1 heading on the homepage
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-2">
              Description (Meta)
            </label>
            <textarea
              value={content.description}
              onChange={(e) => setContent({ ...content, description: e.target.value })}
              className="w-full rounded-lg bg-night-800 px-4 py-3 text-white outline-none placeholder:text-muted focus:ring-2 focus:ring-neon/50 resize-none"
              rows={2}
            />
            <p className="mt-1 text-xs text-muted">
              Shown under the main heading (for SEO and intro)
            </p>
          </div>

          {/* Featured Section */}
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-2">
              Featured Section Text
            </label>
            <textarea
              value={content.featuredSection}
              onChange={(e) => setContent({ ...content, featuredSection: e.target.value })}
              className="w-full rounded-lg bg-night-800 px-4 py-3 text-white outline-none placeholder:text-muted focus:ring-2 focus:ring-neon/50 resize-none"
              rows={4}
            />
            <p className="mt-1 text-xs text-muted">
              Main SEO content paragraph
            </p>
          </div>

          {/* Save Button & Status */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              className="rounded-lg bg-neon px-6 py-2.5 font-bold text-night-950 transition hover:brightness-110"
            >
              Save Changes
            </button>
            {saved && (
              <span className="text-sm text-green-400">✓ Saved successfully</span>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="mt-12">
          <h2 className="font-display text-2xl font-bold text-white mb-6">Preview</h2>
          <div className="glass rounded-2xl p-8 space-y-4">
            <h1 className="font-display text-3xl font-bold text-white">
              {content.mainHeading}
            </h1>
            <p className="text-muted">{content.description}</p>
            <p className="text-white/80 leading-relaxed">{content.featuredSection}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
