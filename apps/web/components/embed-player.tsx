"use client";

import { useState } from "react";
import type { EmbedLink } from "@arena/types";

/** Shows the admin-added embeds; with several sources, tabs switch between them. */
export function EmbedPlayer({ embeds, title }: { embeds: EmbedLink[]; title: string }) {
  const [active, setActive] = useState(0);
  const current = embeds[Math.min(active, embeds.length - 1)];

  return (
    <section className="flex flex-col gap-3">
      <div className="relative aspect-video overflow-hidden border-2 border-pixel-ink bg-black">
        <iframe
          key={current.id}
          src={current.url}
          title={`${title} – ${current.title}`}
          className="absolute inset-0 size-full"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          referrerPolicy="origin"
        />
      </div>
      {embeds.length > 1 && (
        <div className="flex flex-wrap gap-3" role="tablist" aria-label="Stream sources">
          {embeds.map((e, i) => (
            <button
              key={e.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={`px-4 py-1.5 text-xs font-semibold ${i === active ? "bg-neon text-night-950" : "pixel-btn text-white"}`}
            >
              {e.title}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
