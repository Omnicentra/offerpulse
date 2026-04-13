import { redirect } from "next/navigation";
import { TRPCError } from "@trpc/server";
import { getServerSession } from "@/src/server/auth/server-session";
import { getQueryClient, HydrateClient, trpc } from "@/src/lib/trpc/server";
import { CompetitorDetailClient } from "./competitor-detail-client";

interface CompetitorDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CompetitorDetailPage({
  params,
}: CompetitorDetailPageProps) {
  const { id: competitorId } = await params;

  const session = await getServerSession();

  if (!session?.user) {
    redirect("/login");
  }

  const workspaceId = session.user.workspaceId;

  if (!workspaceId) {
    redirect("/login");
  }

  const queryClient = getQueryClient();

  try {
    await queryClient.fetchQuery(
      trpc.competitors.get.queryOptions({ workspaceId, id: competitorId })
    );
  } catch (err) {
    if (err instanceof TRPCError && err.code === "NOT_FOUND") {
      return (
        <HydrateClient>
          <CompetitorDetailClient
            competitorId={competitorId}
            workspaceId={workspaceId}
          />
        </HydrateClient>
      );
    }
    throw err;
  }

  await Promise.all([
    queryClient.prefetchQuery(
      trpc.snapshots.list.queryOptions({ workspaceId, competitorId })
    ),
    queryClient.prefetchQuery(
      trpc.changeEvents.list.queryOptions({ workspaceId, competitorId })
    ),
    queryClient.prefetchQuery(
      trpc.recommendations.list.queryOptions({ workspaceId, competitorId })
    ),
    queryClient.prefetchQuery(
      trpc.monitorSettings.get.queryOptions({ workspaceId, competitorId })
    ),
    queryClient.prefetchQuery(
      trpc.ownStore.get.queryOptions({ workspaceId })
    ),
    queryClient.prefetchQuery(
      trpc.ownStore.products.list.queryOptions({ workspaceId })
    ),
  ]);

  return (
    <HydrateClient>
      <CompetitorDetailClient
        competitorId={competitorId}
        workspaceId={workspaceId}
      />
    </HydrateClient>
  );
}
