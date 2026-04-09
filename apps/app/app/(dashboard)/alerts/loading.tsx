import { Skeleton } from "@/components/ui/skeleton";

export default function AlertsLoading() {
  return (
    <div className="mx-auto flex min-h-[min(100%,calc(100vh-6rem))] max-w-6xl flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Alerts</h1>
        <p className="mt-1 text-sm text-slate-600">
          Choose channels, rules, and optional digests — same layout as Settings (tab
          navigation).
        </p>
      </div>
      <Skeleton className="h-12 w-full max-w-xl rounded-lg" />
      <Skeleton className="mt-6 h-72 rounded-2xl" />
    </div>
  );
}
