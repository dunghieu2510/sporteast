export function LiveBadge({ label }: { label?: string }) {
  return (
    <span className="pixel-tag inline-flex items-center gap-1.5 bg-live px-2.5 py-1 text-xs font-bold tracking-wide text-white">
      <span className="size-2 animate-pulse-live bg-white" />
      LIVE{label && <span className="tabular font-semibold text-white/90">{label}</span>}
    </span>
  );
}
