import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { snapshotsRouter } from "./snapshots";
import { createDbMock } from "@/src/test/db-mock";
import { TEST_IDS, TEST_SUBSCRIPTION, TEST_WORKSPACE_MEMBERSHIP } from "@/src/test/fixtures";

const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
}));

vi.mock("../../jobs/client", () => ({
  inngest: {
    send: sendMock,
  },
}));

describe("snapshotsRouter", () => {
  beforeEach(() => {
    sendMock.mockReset();
  });

  function buildCtx() {
    const db = createDbMock();
    db.query.subscriptions.findFirst.mockResolvedValue(TEST_SUBSCRIPTION);
    db.query.workspaceMembers.findFirst.mockResolvedValue(TEST_WORKSPACE_MEMBERSHIP);

    return {
      db,
      session: { user: { id: TEST_IDS.userId } },
      user: { id: TEST_IDS.userId },
    };
  }

  it("lists snapshots by competitor", async () => {
    const ctx = buildCtx();
    ctx.db.query.competitors.findFirst.mockResolvedValue({
      id: TEST_IDS.competitorId,
      workspaceId: TEST_IDS.workspaceId,
    });
    ctx.db.query.snapshots.findMany.mockResolvedValue([
      { id: TEST_IDS.snapshotId, competitorId: TEST_IDS.competitorId },
    ]);

    const caller = snapshotsRouter.createCaller(ctx as never);
    const result = await caller.list({
      workspaceId: TEST_IDS.workspaceId,
      competitorId: TEST_IDS.competitorId,
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(TEST_IDS.snapshotId);
  });

  it("throws forbidden when snapshot workspace mismatches", async () => {
    const ctx = buildCtx();
    ctx.db.query.snapshots.findFirst.mockResolvedValue({
      id: TEST_IDS.snapshotId,
      competitor: {
        id: TEST_IDS.competitorId,
        workspaceId: "ws_other",
      },
    });

    const caller = snapshotsRouter.createCaller(ctx as never);

    await expect(
      caller.get({
        workspaceId: TEST_IDS.workspaceId,
        id: TEST_IDS.snapshotId,
      })
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    } satisfies Partial<TRPCError>);
  });

  it("queues capture job and triggers inngest event", async () => {
    const ctx = buildCtx();
    ctx.db.query.competitors.findFirst.mockResolvedValue({
      id: TEST_IDS.competitorId,
      workspaceId: TEST_IDS.workspaceId,
    });
    ctx.db.insert.mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });
    sendMock.mockResolvedValue(undefined);

    const caller = snapshotsRouter.createCaller(ctx as never);
    const result = await caller.capture({
      workspaceId: TEST_IDS.workspaceId,
      competitorId: TEST_IDS.competitorId,
    });

    expect(result.jobId.startsWith("job_")).toBe(true);
    expect(sendMock).toHaveBeenCalledWith({
      name: "competitor/capture",
      data: {
        competitorId: TEST_IDS.competitorId,
        workspaceId: TEST_IDS.workspaceId,
      },
    });
  });
});
