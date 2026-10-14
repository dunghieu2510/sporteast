import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid place-items-center gap-4 py-32 text-center">
      <p className="font-display text-7xl font-bold text-neon">404</p>
      <p className="text-muted">This page went out of bounds.</p>
      <Link href="/" className="rounded-full bg-white/10 px-5 py-2 text-sm hover:bg-white/15">
        Back to schedule
      </Link>
    </div>
  );
}
