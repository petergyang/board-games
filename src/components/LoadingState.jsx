export function LoadingState() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 p-4 lg:p-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden animate-pulse">
          <div className="aspect-[4/3] bg-[var(--bg-sidebar)]" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-[var(--bg-sidebar)] rounded w-3/4" />
            <div className="h-3 bg-[var(--bg-sidebar)] rounded w-1/4" />
            <div className="h-3 bg-[var(--bg-sidebar)] rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
