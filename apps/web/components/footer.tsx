import Link from "next/link";

import { getCategories, getPages } from "@/lib/api";
import { Logo } from "@/components/logo";

export async function Footer() {
  const currentYear = new Date().getFullYear();
  const [pages, categories] = await Promise.all([getPages(), getCategories()]);
  const links = (pages.data ?? []).filter((p) => p.showInFooter).map((p) => ({ label: p.title, href: `/${p.slug}` }));
  const sportLinks = (categories.data ?? []).map((c) => ({ label: c.name, href: `/sport/${c.slug}` }));

  return (
    <footer className="border-t-4 border-pixel-ink bg-night-950">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <Logo size={36} />
            </div>
            <p className="text-sm text-muted">
              Live sports schedules, scores and community livestreams for NFL, NBA, NHL, MLB and more.
            </p>
          </div>

          {/* Sports */}
          <div>
            <h3 className="mb-4 font-display font-bold text-white">Sports</h3>
            <ul className="space-y-2">
              {sportLinks.map((sport) => (
                <li key={sport.href}>
                  <Link href={sport.href} className="text-sm text-muted transition hover:text-white">
                    {sport.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 font-display font-bold text-white">Product</h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-sm text-muted transition hover:text-white">
                  Schedule
                </a>
              </li>
              <li>
                <a href="/" className="text-sm text-muted transition hover:text-white">
                  Live Scores
                </a>
              </li>
              <li>
                <a href="/" className="text-sm text-muted transition hover:text-white">
                  Highlights
                </a>
              </li>
              <li>
                <a href="/" className="text-sm text-muted transition hover:text-white">
                  Livestreams
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 font-display font-bold text-white">Company</h3>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 border-t-4 border-dotted border-white/15" />

        {/* Bottom */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted">
            &copy; {currentYear} Sporteast. All rights reserved. Sports content for educational and informational purposes.
          </p>
          <div className="flex gap-4">
            <a href="#" aria-label="Twitter" className="text-muted transition hover:text-neon">
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7a10.6 10.6 0 01-1.5.08Z" />
              </svg>
            </a>
            <a href="#" aria-label="Discord" className="text-muted transition hover:text-neon">
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.317 1.5H17.79c.946 0 1.75.804 1.75 1.75v15.446a1.75 1.75 0 01-2.674 1.513L18.5 18.263l-10.683 1.396a1.75 1.75 0 01-1.817-1.75V3.25c0-.946.804-1.75 1.75-1.75Z" />
              </svg>
            </a>
            <a href="#" aria-label="YouTube" className="text-muted transition hover:text-neon">
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3 3 0 00-2.122-2.122C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.564A3 3 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3 3 0 002.122 2.122c1.872.564 9.377.564 9.377.564s7.505 0 9.377-.564a3 3 0 002.122-2.122c.502-1.884.502-5.814.502-5.814s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
