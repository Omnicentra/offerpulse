import { Skeleton } from "@/components/ui/skeleton";

export default function CompetitorDetailLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="mb-4 h-9 w-52 rounded-md" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Skeleton className="h-16 w-16 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-8 w-48 max-w-full rounded-md" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-56 max-w-full rounded-md" />
              <div className="flex flex-wrap gap-2 pt-1">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-28 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-36 rounded-md" />
          </div>
        </div>
      </div>

      <div className="flex w-full flex-wrap gap-2 border-b border-slate-200 pb-2">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-[4.5rem] rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-36 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>

      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="min-h-[12rem] w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
