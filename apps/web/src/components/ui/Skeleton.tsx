export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-zinc-200 dark:bg-zinc-700 rounded ${className}`} />;
}
