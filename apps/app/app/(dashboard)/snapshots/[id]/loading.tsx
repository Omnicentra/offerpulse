import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function SnapshotDetailLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="mb-4 h-9 w-44 rounded-md" />
        <PageHeader
          title="Snapshot Report"
          description="Loading capture details and offer signals…"
          action={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Skeleton className="h-9 w-28 rounded-md" />
              <Skeleton className="h-9 w-40 rounded-md" />
            </div>
          }
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <div className="flex justify-center">
            <Skeleton className="h-56 w-56 shrink-0 rounded-full" />
          </div>
          <div className="flex flex-col justify-center space-y-5">
            <div>
              <Skeleton className="h-6 w-40 rounded-full" />
              <Skeleton className="mt-3 h-5 w-full max-w-lg rounded-md" />
              <Skeleton className="mt-2 h-5 w-full max-w-md rounded-md" />
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold text-slate-900">
          Offer Stack Detected
        </h2>
        <Skeleton className="mb-4 h-4 max-w-2xl rounded-md" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>

      <Skeleton className="h-[min(70vh,520px)] w-full rounded-2xl" />
    </div>
  );
}
