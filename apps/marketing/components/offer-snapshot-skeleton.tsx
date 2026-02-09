import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function OfferSnapshotSkeleton() {
  return (
    <Card className="w-full overflow-hidden border-2">
      <CardHeader className="bg-muted/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="mt-4 flex gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-36" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-4 w-48" />
            {i < 5 && <div className="h-px w-full bg-border" />}
          </div>
        ))}

        <div className="mt-6 rounded-lg border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-5 w-5 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
