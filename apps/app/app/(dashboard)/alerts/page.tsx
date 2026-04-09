import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Suspense } from "react";
import { auth } from "@/src/server/auth";
import { createCaller } from "@/src/lib/trpc/server";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertsPageClient } from "./alerts-page-client";

function AlertsPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Alerts</h1>
        <p className="mt-1 text-sm text-slate-600">Loading…</p>
      </div>
      <Skeleton className="h-12 w-full max-w-xl rounded-lg" />
      <Skeleton className="mt-6 h-72 rounded-2xl" />
    </div>
  );
}

export default async function AlertsPage() {
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
  const initialSettings = await caller.alerts.get({ workspaceId });

  return (
    <Suspense fallback={<AlertsPageSkeleton />}>
      <AlertsPageClient
        workspaceId={workspaceId}
        initialSettings={initialSettings}
      />
    </Suspense>
  );
}
