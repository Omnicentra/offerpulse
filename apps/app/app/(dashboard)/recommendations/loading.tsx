import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function RecommendationsLoading() {
  return (
    <div className="mx-auto space-y-8">
      <div className="space-y-2">
        <PageHeader
          title="Recommendations"
          description="Scan the list collapsed; open a row for rationale, checklist, and actions."
        />
        <Skeleton className="h-5 w-48 max-w-full" />
      </div>
      <Skeleton className="h-14 w-full max-w-xl rounded-xl" />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
