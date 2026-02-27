import { redirect } from "next/navigation";
import { TRPCError } from "@trpc/server";
import { createCaller } from "@/src/lib/trpc/server";
import { SnapshotDetailClient } from "./snapshot-detail-client";
import { auth } from '@/src/server/auth';
import { headers } from "next/headers";

interface SnapshotDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SnapshotDetailPage({ params }: SnapshotDetailPageProps) {
  const { id: snapshotId } = await params;  
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }
  const caller = await createCaller();
  const workspaceId = session.user.workspaceId;

  let initialSnapshot: Awaited<
    ReturnType<typeof caller.snapshots.get>
  > | null = null;
  let initialCompetitors: Awaited<
    ReturnType<typeof caller.competitors.list>
  > = [];
  let initialAllSnapshots: Awaited<
    ReturnType<typeof caller.snapshots.list>
  > = [];
  let initialChanges: Awaited<
    ReturnType<typeof caller.changeEvents.list>
  > = [];

  try {
    const snapshot = await caller.snapshots.get({ workspaceId, id: snapshotId });
    initialSnapshot = snapshot;

    const [competitors, allSnapshots, changes] = await Promise.all([
      caller.competitors.list({ workspaceId }),
      caller.snapshots.list({ workspaceId }),
      caller.changeEvents.list({ workspaceId }),
    ]);
    initialCompetitors = competitors;
    initialAllSnapshots = allSnapshots;
    initialChanges = changes;
  } catch (err) {
    if (err instanceof TRPCError && err.code === "NOT_FOUND") {
      initialSnapshot = null;
    } else {
      throw err;
    }
  }

  return (
    <SnapshotDetailClient
      snapshotId={snapshotId}
      workspaceId={workspaceId}
      initialSnapshot={initialSnapshot}
      initialCompetitors={initialCompetitors}
      initialAllSnapshots={initialAllSnapshots}
      initialChanges={initialChanges}
    />
  );
}
