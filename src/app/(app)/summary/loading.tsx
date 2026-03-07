export default function SummaryLoading() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-36 animate-pulse rounded bg-muted" />
      {Array.from({ length: 3 }).map((_, g) => (
        <div key={g} className="space-y-3">
          <div className="h-5 w-28 animate-pulse rounded bg-muted" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2">
              <div className="h-5 w-12 animate-pulse rounded-full bg-muted" />
              <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
