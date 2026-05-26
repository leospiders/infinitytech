export function LoadingSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-3 p-4">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded-lg bg-[#D2D6DC]/40 dark:bg-[#1F1E2E]/60 animate-pulse"
          style={{ width: `${60 + Math.random() * 40}%` }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="neo-card p-6 animate-pulse">
      <div className="h-3 w-24 rounded bg-[#D2D6DC]/40 dark:bg-[#1F1E2E]/60 mb-3" />
      <div className="h-8 w-32 rounded bg-[#D2D6DC]/40 dark:bg-[#1F1E2E]/60" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 rounded-lg bg-[#D2D6DC]/30 dark:bg-[#1F1E2E]/40 animate-pulse" />
      ))}
    </div>
  );
}
