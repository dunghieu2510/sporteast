export function MockNotice() {
  return (
    <p className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-200">
      Showing <strong>demo data</strong> because the API is unreachable. Run <code>npm run db:up</code> then{" "}
      <code>npm run dev</code> to use live data.
    </p>
  );
}
