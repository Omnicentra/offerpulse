import { TRPCError } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";
import { competitorsRouter } from "./competitors";
import { createDbMock } from "@/src/test/db-mock";
import { TEST_IDS, TEST_SUBSCRIPTION, TEST_WORKSPACE_MEMBERSHIP } from "@/src/test/fixtures";

describe("competitorsRouter", () => {
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

  it("lists competitors for workspace", async () => {
    const ctx = buildCtx();
    ctx.db.query.competitors.findMany.mockResolvedValue([
      { id: TEST_IDS.competitorId, workspaceId: TEST_IDS.workspaceId },
    ]);

    const caller = competitorsRouter.createCaller(ctx as never);
    const result = await caller.list({
      workspaceId: TEST_IDS.workspaceId,
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(TEST_IDS.competitorId);
  });

  it("throws not_found when competitor does not exist", async () => {
    const ctx = buildCtx();
    ctx.db.query.competitors.findFirst.mockResolvedValue(null);

    const caller = competitorsRouter.createCaller(ctx as never);

    await expect(
      caller.get({
        workspaceId: TEST_IDS.workspaceId,
        id: TEST_IDS.competitorId,
      })
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    } satisfies Partial<TRPCError>);
  });

  it("creates competitor and default monitor settings", async () => {
    const ctx = buildCtx();
    const competitorInsertValues = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([
        {
          id: TEST_IDS.competitorId,
          workspaceId: TEST_IDS.workspaceId,
          name: "Nike",
          domain: "nike.com",
          baseUrl: "https://nike.com",
        },
      ]),
    });

    const monitorInsertValues = vi.fn().mockResolvedValue(undefined);
    ctx.db.insert
      .mockReturnValueOnce({
        values: competitorInsertValues,
      })
      .mockReturnValueOnce({
        values: monitorInsertValues,
      });

    const caller = competitorsRouter.createCaller(ctx as never);
    const result = await caller.create({
      workspaceId: TEST_IDS.workspaceId,
      name: "Nike",
      domain: "nike.com",
      baseUrl: "https://nike.com",
      platformGuess: "shopify",
      tags: [],
      isActive: true,
    });

    expect(result.name).toBe("Nike");
    expect(ctx.db.insert).toHaveBeenCalledTimes(2);
    expect(competitorInsertValues).toHaveBeenCalledOnce();
    expect(monitorInsertValues).toHaveBeenCalledOnce();
  });
});
