import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function StoreSettingsLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 shrink-0 rounded-md" />
        <PageHeader
          title="Your store"
          description="Configure your store details, products, and promotions for personalized competitor insights"
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Skeleton className="mb-6 h-7 w-48 rounded-md" />
        <div className="space-y-4">
          <Skeleton className="h-4 max-w-xl rounded-md" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Skeleton className="h-10 flex-1 rounded-md" />
            <Skeleton className="h-10 w-40 shrink-0 rounded-md" />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Skeleton className="mb-6 h-7 w-36 rounded-md" />
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Skeleton className="mb-6 h-7 w-32 rounded-md" />
        <Skeleton className="mb-4 h-4 max-w-2xl rounded-md" />
        <div className="space-y-3">
          <div className="flex gap-4 border-b border-slate-100 pb-3">
            <Skeleton className="h-4 flex-1 rounded-md" />
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-4 w-20 rounded-md" />
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-4 py-2">
              <Skeleton className="h-4 flex-1 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-4 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Skeleton className="mb-6 h-7 w-36 rounded-md" />
        <Skeleton className="mb-4 h-4 max-w-2xl rounded-md" />
        <div className="space-y-3">
          <div className="flex gap-4 border-b border-slate-100 pb-3">
            <Skeleton className="h-4 flex-1 rounded-md" />
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4 py-2">
              <Skeleton className="h-4 flex-1 rounded-md" />
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
