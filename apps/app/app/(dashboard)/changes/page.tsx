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
    <div>
      <PageHeader title="Changes" />
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
