import { vi } from "vitest";

export function createDbMock() {
  return {
    query: {
      subscriptions: {
        findFirst: vi.fn(),
      },
      workspaceMembers: {
        findFirst: vi.fn(),
      },
      competitors: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      snapshots: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      scrapeJobs: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}
