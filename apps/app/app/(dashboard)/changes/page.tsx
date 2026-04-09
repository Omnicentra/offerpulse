import { redirect } from "next/navigation";
import { createCaller } from "@/src/lib/trpc/server";
import { auth } from "@/src/server/auth";
import { headers } from "next/headers";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ChangesPageClient } from "./changes-page-client";

function ChangesPageSkeleton() {
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

export default async function ChangesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const workspaceId = session.user.workspaceId;

  if (!workspaceId) {
    redirect("/login");
  }

  const caller = await createCaller();

  const [competitors, changes] = await Promise.all([
    caller.competitors.list({ workspaceId }),
    caller.changeEvents.list({ workspaceId }),
  ]);

  return (
    <Suspense fallback={<ChangesPageSkeleton />}>
      <ChangesPageClient
        workspaceId={workspaceId}
        initialCompetitors={competitors}
        initialChanges={changes}
      />
    </Suspense>
  );
}
