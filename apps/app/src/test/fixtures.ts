export const TEST_IDS = {
  workspaceId: "ws_test",
  userId: "user_test",
  competitorId: "comp_test",
  snapshotId: "snap_test",
};

export const TEST_SUBSCRIPTION = {
  id: "sub_test",
  userId: TEST_IDS.userId,
  status: "active",
  currentPeriodEnd: new Date(Date.now() + 86_400_000),
};

export const TEST_WORKSPACE_MEMBERSHIP = {
  id: "wm_test",
  userId: TEST_IDS.userId,
  workspaceId: TEST_IDS.workspaceId,
  workspace: {
    id: TEST_IDS.workspaceId,
    name: "Test Workspace",
    slug: "test-workspace",
  },
};
