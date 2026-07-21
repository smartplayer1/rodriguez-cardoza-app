import { Skeleton } from "./skeleton";
import { cn } from "./utils";

/**
 * Drop-in replacement for a <tbody> while a table's data is loading.
 * Usage: {loading ? <TableSkeleton columns={7} /> : rows.map(...)}
 */
export function TableSkeleton({
  rows = 5,
  columns,
}: {
  rows?: number;
  columns: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-border/40">
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <td key={columnIndex} className="px-4 py-3">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/**
 * Grid of card-shaped placeholders, for pages that render results as cards
 * instead of a table (e.g. roles grid). Caller keeps its own grid wrapper
 * classes and only swaps children for this while loading.
 */
export function CardsSkeleton({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "rounded-2xl border border-border/60 bg-background/70 p-4",
            className,
          )}
        >
          <Skeleton className="mb-3 h-5 w-1/2" />
          <Skeleton className="mb-2 h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </>
  );
}

/**
 * Stack of simple row placeholders, for lists/dropdowns/selectors.
 */
export function ListSkeleton({
  count = 5,
  className,
  itemClassName,
}: {
  count?: number;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn("h-10 w-full rounded-xl", itemClassName)}
        />
      ))}
    </div>
  );
}

/**
 * Generic rectangular placeholder for a single block of content
 * (a form section, a summary card, a chart, etc.).
 */
export function BlockSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-24 w-full rounded-2xl", className)} />;
}

/**
 * Full-page skeleton for Next.js route-level loading.tsx files: a header
 * placeholder plus a few block/list placeholders standing in for content.
 */
export function PageLoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-20 w-full rounded-2xl" />
      <ListSkeleton count={6} itemClassName="h-12" />
    </div>
  );
}
