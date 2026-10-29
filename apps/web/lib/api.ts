import {
  DEFAULT_SITE,
  type CategoryContent,
  type LeagueSummary,
  type MatchDetail,
  type MatchStatus,
  type MatchSummary,
  type PageContent,
  type SiteSettings,
} from "@arena/types";
import { mockLeagues, mockMatchDetail, mockMatches } from "./mock";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
/** Which site's content (categories/pages/settings) this deployed instance serves. Matches are shared, unaffected. */
export const SITE_KEY = process.env.SITE_KEY ?? DEFAULT_SITE;

/**
 * Gọi API; nếu API/DB chưa chạy thì dùng dữ liệu mẫu để vẫn phát triển giao diện được.
 * Trả về `source` để UI hiển thị thông báo "demo data".
 */
async function request<T>(path: string, fallback: () => T | null): Promise<{ data: T | null; source: "api" | "mock" }> {
  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      next: { revalidate: 15 },
      signal: AbortSignal.timeout(2500),
    });
    if (res.status === 404) return { data: null, source: "api" };
    if (!res.ok) throw new Error(`API ${res.status}`);
    return { data: (await res.json()) as T, source: "api" };
  } catch {
    return { data: fallback(), source: "mock" };
  }
}

export function getLeagues() {
  return request<LeagueSummary[]>("/leagues", mockLeagues);
}

export function getMatches(opts: { status?: MatchStatus; date?: string } = {}) {
  const { status, date } = opts;
  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  if (date) qs.set("date", date);
  const q = qs.toString();
  return request<MatchSummary[]>(`/matches${q ? `?${q}` : ""}`, () =>
    status ? mockMatches().filter((m) => m.status === status) : mockMatches(),
  );
}

const fallbackCategory = (slug: string, name: string, icon: string): CategoryContent => ({
  id: slug, slug, name, icon, sortOrder: 0, active: true,
  heading: null, description: null, contentTitle: null, content: null, metaTitle: null, metaDescription: null,
});
const FALLBACK_CATEGORIES: CategoryContent[] = [
  fallbackCategory("nfl", "NFL", "🏈"),
  fallbackCategory("ncaaf", "NCAAF", "🏈"),
  fallbackCategory("mlb", "MLB", "⚾"),
  fallbackCategory("nba-streams", "NBA", "🏀"),
  fallbackCategory("soccer", "Soccer", "⚽"),
  fallbackCategory("wnba", "WNBA", "🏀"),
  fallbackCategory("nhl", "NHL", "🏒"),
];

export function getCategories() {
  return request<CategoryContent[]>(`/categories?site=${SITE_KEY}`, () => FALLBACK_CATEGORIES);
}

export function getCategory(slug: string) {
  return request<CategoryContent>(`/categories/${encodeURIComponent(slug)}?site=${SITE_KEY}`, () =>
    FALLBACK_CATEGORIES.find((c) => c.slug === slug) ?? null,
  );
}

export function getCategoryRedirect(slug: string) {
  return request<{ toSlug: string }>(`/categories/${encodeURIComponent(slug)}/redirect?site=${SITE_KEY}`, () => null);
}

export function getPages() {
  return request<PageContent[]>(`/pages?site=${SITE_KEY}`, () => []);
}

const DEFAULT_SETTINGS: SiteSettings = { logoTextMain: "SPORT", logoTextAccent: "EAST" };

export function getSettings() {
  return request<SiteSettings>(`/settings?site=${SITE_KEY}`, () => DEFAULT_SETTINGS);
}

export function getPage(slug: string) {
  return request<PageContent>(`/pages/${encodeURIComponent(slug)}?site=${SITE_KEY}`, () => null);
}

export function getMatch(slug: string) {
  return request<MatchDetail>(`/matches/${encodeURIComponent(slug)}`, () => mockMatchDetail(slug));
}
