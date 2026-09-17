import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeleton } from '@/components/ui/loading-skeleton';

export default function SucursalesLoading() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>

        <Skeleton className="h-24 w-full rounded-2xl" />

        <div className="overflow-hidden rounded-2xl border border-border/60">
          <table className="min-w-full">
            <tbody>
              <TableSkeleton rows={6} columns={6} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
