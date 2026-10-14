import Link from "next/link";
import { getCategories } from "@/lib/api";
import { Logo, LogoMark } from "@/components/logo";

export async function Navbar() {
  const { data } = await getCategories();
  const sports = (data ?? []).map((c) => ({ label: c.name, slug: c.slug, icon: c.icon }));

  return (
    <header className="sticky top-0 z-40 border-b-4 border-pixel-ink bg-night-950">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="flex h-[72px] items-center gap-6 overflow-x-auto px-1 py-2">
          <Link href="/" aria-label="Sporteast home" className="flex shrink-0 items-center">
            <span className="sm:hidden">
              <LogoMark size={34} />
            </span>
            <span className="hidden sm:block">
              <Logo size={34} />
            </span>
          </Link>
          <nav className="flex gap-3 pr-2">
            {sports.map((s) => (
              <Link
                key={s.slug}
                href={`/sport/${s.slug}`}
                className="pixel-btn flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white sm:px-4 sm:text-sm"
              >
                <span>{s.icon}</span>
                {s.label}
              </Link>
            ))}
            <button
              type="button"
              className="pixel-btn flex shrink-0 items-center gap-1 px-3 py-1.5 text-xs font-semibold text-muted hover:text-white sm:px-4 sm:text-sm"
            >
              More Sports
              <span className="text-[10px]">›</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
