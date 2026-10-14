"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-fetches the server-rendered page so countdowns and status stay current. */
export function AutoRefresh({ intervalMs = 60_000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
