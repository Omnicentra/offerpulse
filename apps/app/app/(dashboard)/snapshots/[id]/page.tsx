import { redirect } from "next/navigation";
import { TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import { auth } from "@/src/server/auth";
import { getQueryClient, HydrateClient, trpc } from "@/src/lib/trpc/server";
import { SnapshotDetailClient } from "./snapshot-detail-client";

interface SnapshotDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SnapshotDetailPage({
  params,
}: SnapshotDetailPageProps) {
  const { id: snapshotId } = await params;
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

  const queryClient = getQueryClient();

  try {
    await queryClient.fetchQuery(
      trpc.snapshots.get.queryOptions({ workspaceId, id: snapshotId })
    );
  } catch (err) {
    if (err instanceof TRPCError && err.code === "NOT_FOUND") {
      return (
        <HydrateClient>
          <SnapshotDetailClient
            snapshotId={snapshotId}
            workspaceId={workspaceId}
          />
        </HydrateClient>
      );
    }
    throw err;
  }

  await Promise.all([
    queryClient.prefetchQuery(
      trpc.competitors.list.queryOptions({ workspaceId })
    ),
    queryClient.prefetchQuery(
      trpc.snapshots.list.queryOptions({ workspaceId })
    ),
    queryClient.prefetchQuery(
      trpc.changeEvents.list.queryOptions({ workspaceId })
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
      <SnapshotDetailClient snapshotId={snapshotId} workspaceId={workspaceId} />
    </HydrateClient>
  );
}
