import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChangesLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        compact
        title="Changes"
        description="Updates detected between competitor snapshots."
      />
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}
