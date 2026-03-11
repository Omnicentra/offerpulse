import { TRPCError } from "@trpc/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { desc, eq } from "drizzle-orm";
import { snapshots } from "@/src/server/db/schema";
import { SnapshotReportPdf, type SnapshotPdfModel } from "./templates/snapshot-report";

interface GenerateSnapshotPdfParams {
  db: any;
  workspaceId: string;
  snapshotId: string;
}

function formatTime(timestamp: string | Date) {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function generateSnapshotPdf({
  db,
  workspaceId,
  snapshotId,
}: GenerateSnapshotPdfParams): Promise<{ buffer: Buffer; model: SnapshotPdfModel }> {
  const snapshot = await db.query.snapshots.findFirst({
    where: eq(snapshots.id, snapshotId),
    with: {
      competitor: true,
    },
  });

  if (!snapshot) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Snapshot not found",
    });
  }

  if (snapshot.competitor.workspaceId !== workspaceId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied",
    });
  }

  const previousSnapshots: Array<{
    capturedAt: string | Date;
    extractedSignals: SnapshotPdfModel["current"];
  }> = await db.query.snapshots.findMany({
    where: eq(snapshots.competitorId, snapshot.competitorId),
    orderBy: [desc(snapshots.capturedAt)],
  });

  const previous = previousSnapshots
    .filter((s) => new Date(s.capturedAt) < new Date(snapshot.capturedAt))
    .sort(
      (a, b) =>
        new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
    )[0];

  const model: SnapshotPdfModel = {
    snapshotId: snapshot.id,
    competitorName: snapshot.competitor.name,
    competitorDomain: snapshot.competitor.domain,
    capturedAt: formatTime(snapshot.capturedAt),
    screenshotUrl: snapshot.screenshotUrl,
    current: snapshot.extractedSignals,
    previous: previous?.extractedSignals,
  };

  const buffer = await renderToBuffer(<SnapshotReportPdf model={model} />);
  return { buffer, model };
}
