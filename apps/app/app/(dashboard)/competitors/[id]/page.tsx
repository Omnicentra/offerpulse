import { redirect } from "next/navigation";
import { TRPCError } from "@trpc/server";
import { createCaller } from "@/src/lib/trpc/server";
import { auth } from "@/src/server/auth";
import { headers } from "next/headers";
import { CompetitorDetailClient } from "./competitor-detail-client";

interface CompetitorDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CompetitorDetailPage({
  params,
}: CompetitorDetailPageProps) {
  const { id: competitorId } = await params;

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

  // // Require active subscription before calling workspace procedures
  // const subscription = await caller.billing.getSubscription();
  // const isActive = ["active", "trialing"].includes(
  //   subscription?.status ?? ""
  // );
  // if (!subscription || !isActive) {
  //   redirect("/settings/billing");
  // }

  let initialCompetitor: Awaited<
    ReturnType<typeof caller.competitors.get>
  > | null = null;
  let initialSnapshots: Awaited<
    ReturnType<typeof caller.snapshots.list>
  > = [];
  let initialChanges: Awaited<
    ReturnType<typeof caller.changeEvents.list>
  > = [];
  let initialRecommendations: Awaited<
    ReturnType<typeof caller.recommendations.list>
  > = [];
  let initialMonitorSettings: Awaited<
    ReturnType<typeof caller.monitorSettings.get>
  > | null = null;

  try {
    const [competitor, snapshots, changes, recommendations, monitorSettings] =
      await Promise.all([
        caller.competitors.get({ workspaceId, id: competitorId }),
        caller.snapshots.list({ workspaceId, competitorId }),
        caller.changeEvents.list({ workspaceId, competitorId }),
        caller.recommendations.list({ workspaceId, competitorId }),
        caller.monitorSettings.get({ workspaceId, competitorId }),
      ]);

    initialCompetitor = competitor;
    initialSnapshots = snapshots;
    initialChanges = changes;
    initialRecommendations = recommendations;
    initialMonitorSettings = monitorSettings;
  } catch (err) {
    if (err instanceof TRPCError && err.code === "NOT_FOUND") {
      initialCompetitor = null;
    } else {
      throw err;
    }
  }

  return (
    <CompetitorDetailClient
      competitorId={competitorId}
      workspaceId={workspaceId}
      initialCompetitor={initialCompetitor}
      initialSnapshots={initialSnapshots}
      initialChanges={initialChanges}
      initialRecommendations={initialRecommendations}
      initialMonitorSettings={initialMonitorSettings}
    />
  );
}
