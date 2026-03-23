import { RecommendationStrategy } from "@offerpulse/lib/constants";
import { mockDB } from "./db";
import type {
  Competitor,
  MonitorSettings,
  Snapshot,
  ChangeEvent,
  Recommendation,
  AlertSettings,
  WeeklyPulse,
  User,
  WorkspaceSettings,
  ExtractedSignals,
  RecommendationChecklistItem,
} from "./types";

// Simulate network latency
const delay = (ms?: number) =>
  new Promise((resolve) => setTimeout(resolve, ms || Math.random() * 350 + 250));

// Simulate occasional errors (1-3%)
const simulateError = () => {
  if (Math.random() < 0.02) {
    throw new Error("Simulated network error");
  }
};

// Competitors API
export const competitorsApi = {
  async list(): Promise<Competitor[]> {
    await delay();
    simulateError();
    return mockDB.getData().competitors;
  },

  async get(id: string): Promise<Competitor | null> {
    await delay();
    simulateError();
    const competitor = mockDB.getData().competitors.find((c) => c.id === id);
    return competitor || null;
  },

  async create(
    data: Omit<Competitor, "id" | "createdAt" | "lastSnapshotAt">
  ): Promise<Competitor> {
    await delay();
    simulateError();

    const db = mockDB.getData();
    const newCompetitor: Competitor = {
      ...data,
      id: `comp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    db.competitors.push(newCompetitor);
    mockDB.setData(db);

    return newCompetitor;
  },

  async update(id: string, data: Partial<Competitor>): Promise<Competitor> {
    await delay();
    simulateError();

    const db = mockDB.getData();
    const index = db.competitors.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Competitor not found");

    db.competitors[index] = { ...db.competitors[index], ...data };
    mockDB.setData(db);

    return db.competitors[index];
  },

  async delete(id: string): Promise<void> {
    await delay();
    simulateError();

    const db = mockDB.getData();
    db.competitors = db.competitors.filter((c) => c.id !== id);
    db.monitorSettings = db.monitorSettings.filter((s) => s.competitorId !== id);
    db.snapshots = db.snapshots.filter((s) => s.competitorId !== id);
    db.changeEvents = db.changeEvents.filter((e) => e.competitorId !== id);
    db.recommendations = db.recommendations.filter((r) => r.competitorId !== id);
    mockDB.setData(db);
  },
};

// Monitor Settings API
export const monitorSettingsApi = {
  async get(competitorId: string): Promise<MonitorSettings | null> {
    await delay(150);
    const settings = mockDB.getData().monitorSettings.find((s) => s.competitorId === competitorId);
    return settings || null;
  },

  async upsert(settings: MonitorSettings): Promise<MonitorSettings> {
    await delay();
    simulateError();

    const db = mockDB.getData();
    const index = db.monitorSettings.findIndex((s) => s.competitorId === settings.competitorId);

    if (index === -1) {
      db.monitorSettings.push(settings);
    } else {
      db.monitorSettings[index] = settings;
    }

    mockDB.setData(db);
    return settings;
  },
};

// Snapshots API
export const snapshotsApi = {
  async list(competitorId?: string): Promise<Snapshot[]> {
    await delay();
    simulateError();

    const snapshots = mockDB.getData().snapshots;
    return competitorId
      ? snapshots.filter((s) => s.competitorId === competitorId)
      : snapshots;
  },

  async get(id: string): Promise<Snapshot | null> {
    await delay();
    const snapshot = mockDB.getData().snapshots.find((s) => s.id === id);
    return snapshot || null;
  },

  async capture(competitorId: string): Promise<{
    snapshot: Snapshot;
    changeEvent?: ChangeEvent;
    recommendation?: Recommendation;
  }> {
    await delay(800); // Longer delay for capture operation
    simulateError();

    const db = mockDB.getData();
    const competitor = db.competitors.find((c) => c.id === competitorId);
    if (!competitor) throw new Error("Competitor not found");

    // Get previous snapshot for this competitor
    const previousSnapshots = db.snapshots
      .filter((s) => s.competitorId === competitorId)
      .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());
    const previousSnapshot = previousSnapshots[0];

    // Generate mock snapshot with random variations
    const hasPromo = Math.random() > 0.5;
    const hasShipping = Math.random() > 0.4;
    const hasBundle = Math.random() > 0.7;

    const newSignals: ExtractedSignals = {
      confidence: ["low", "medium", "high"][Math.floor(Math.random() * 3)] as any,
    };

    if (hasPromo) {
      newSignals.discountPercent = [10, 15, 20, 25, 30][Math.floor(Math.random() * 5)];
      newSignals.promoText = `${newSignals.discountPercent}% OFF ${
        ["SITEWIDE", "SELECT ITEMS", "NEW ARRIVALS"][Math.floor(Math.random() * 3)]
      }`;
      newSignals.discountCode = `SAVE${newSignals.discountPercent}`;
    }

    if (hasShipping) {
      newSignals.shippingThreshold = [0, 25, 50, 75][Math.floor(Math.random() * 4)];
      newSignals.shippingText =
        newSignals.shippingThreshold === 0
          ? "Free shipping on all orders"
          : `Free shipping on orders over $${newSignals.shippingThreshold}`;
    }

    if (hasBundle) {
      newSignals.bundleText = "Buy 2 Get 1 Free";
    }

    const newSnapshot: Snapshot = {
      id: `snap-${Date.now()}`,
      competitorId,
      capturedAt: new Date().toISOString(),
      extractedSignals: newSignals,
    };

    db.snapshots.push(newSnapshot);

    // Update competitor's lastSnapshotAt
    const compIndex = db.competitors.findIndex((c) => c.id === competitorId);
    if (compIndex !== -1) {
      db.competitors[compIndex].lastSnapshotAt = newSnapshot.capturedAt;
    }

    // Detect changes (50% chance)
    let newChangeEvent: ChangeEvent | undefined;
    let newRecommendation: Recommendation | undefined;

    if (previousSnapshot && Math.random() > 0.5) {
      const changeType =
        (["PROMO", "SHIPPING", "BUNDLE", "CART_INCENTIVE", "DELIVERY_RETURNS"] as const)[
          Math.floor(Math.random() * 5)
        ];

      newChangeEvent = {
        id: `change-${Date.now()}`,
        competitorId,
        detectedAt: new Date().toISOString(),
        type: changeType,
        confidence: newSignals.confidence,
        summary: `Detected ${changeType.toLowerCase()} change`,
        before: previousSnapshot.extractedSignals,
        after: newSignals,
        snapshotBeforeId: previousSnapshot.id,
        snapshotAfterId: newSnapshot.id,
      };

      db.changeEvents.push(newChangeEvent);

      // Generate recommendation (70% chance)
      if (Math.random() > 0.3) {
        const strategies = [
          RecommendationStrategy.MATCH,
          RecommendationStrategy.COUNTER,
          RecommendationStrategy.IGNORE,
          RecommendationStrategy.TEST,
        ];
        const strategy = strategies[Math.floor(Math.random() * strategies.length)]!;

        newRecommendation = {
          id: `rec-${Date.now()}`,
          changeEventId: newChangeEvent.id,
          competitorId,
          strategy,
          impact: Math.floor(Math.random() * 5) + 5,
          effort: Math.floor(Math.random() * 5) + 2,
          title: `${strategy} competitor's ${changeType.toLowerCase()} change`,
          rationale: `Consider ${strategy.toLowerCase()}ing this change to maintain competitiveness.`,
          checklist: [
            {
              id: `c1-${Date.now()}`,
              text: "Review change details",
              done: false,
            },
            {
              id: `c2-${Date.now()}`,
              text: "Assess impact on business",
              done: false,
            },
            {
              id: `c3-${Date.now()}`,
              text: "Implement response",
              done: false,
            },
          ],
          status: "open",
        };

        db.recommendations.push(newRecommendation);
      }
    }

    mockDB.setData(db);

    return {
      snapshot: newSnapshot,
      changeEvent: newChangeEvent,
      recommendation: newRecommendation,
    };
  },
};

// Change Events API
export const changeEventsApi = {
  async list(filters?: {
    competitorId?: string;
    type?: string[];
    confidence?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ChangeEvent[]> {
    await delay();
    simulateError();

    let events = mockDB.getData().changeEvents;

    if (filters?.competitorId) {
      events = events.filter((e) => e.competitorId === filters.competitorId);
    }

    if (filters?.type && filters.type.length > 0) {
      events = events.filter((e) => filters.type!.includes(e.type));
    }

    if (filters?.confidence) {
      events = events.filter((e) => e.confidence === filters.confidence);
    }

    if (filters?.dateFrom) {
      events = events.filter((e) => e.detectedAt >= filters.dateFrom!);
    }

    if (filters?.dateTo) {
      events = events.filter((e) => e.detectedAt <= filters.dateTo!);
    }

    return events.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
  },

  async get(id: string): Promise<ChangeEvent | null> {
    await delay();
    const event = mockDB.getData().changeEvents.find((e) => e.id === id);
    return event || null;
  },
};

// Recommendations API
export const recommendationsApi = {
  async list(filters?: {
    status?: string;
    competitorId?: string;
    minImpact?: number;
    maxEffort?: number;
  }): Promise<Recommendation[]> {
    await delay();
    simulateError();

    let recs = mockDB.getData().recommendations;

    if (filters?.status) {
      recs = recs.filter((r) => r.status === filters.status);
    }

    if (filters?.competitorId) {
      recs = recs.filter((r) => r.competitorId === filters.competitorId);
    }

    if (filters?.minImpact !== undefined) {
      recs = recs.filter((r) => r.impact >= filters.minImpact!);
    }

    if (filters?.maxEffort !== undefined) {
      recs = recs.filter((r) => r.effort <= filters.maxEffort!);
    }

    return recs;
  },

  async get(id: string): Promise<Recommendation | null> {
    await delay();
    const rec = mockDB.getData().recommendations.find((r) => r.id === id);
    return rec || null;
  },

  async updateStatus(
    id: string,
    status: "open" | "done" | "snoozed",
    snoozedUntil?: string
  ): Promise<Recommendation> {
    await delay();
    simulateError();

    const db = mockDB.getData();
    const index = db.recommendations.findIndex((r) => r.id === id);
    if (index === -1) throw new Error("Recommendation not found");

    db.recommendations[index].status = status;
    if (snoozedUntil) {
      db.recommendations[index].snoozedUntil = snoozedUntil;
    }

    mockDB.setData(db);
    return db.recommendations[index];
  },

  async updateChecklist(
    id: string,
    checklist: RecommendationChecklistItem[]
  ): Promise<Recommendation> {
    await delay(100);
    simulateError();

    const db = mockDB.getData();
    const index = db.recommendations.findIndex((r) => r.id === id);
    if (index === -1) throw new Error("Recommendation not found");

    db.recommendations[index].checklist = checklist;
    mockDB.setData(db);
    return db.recommendations[index];
  },
};

// Alerts API
export const alertsApi = {
  async get(): Promise<AlertSettings> {
    await delay();
    return mockDB.getData().alertSettings;
  },

  async update(settings: Partial<AlertSettings>): Promise<AlertSettings> {
    await delay();
    simulateError();

    const db = mockDB.getData();
    db.alertSettings = { ...db.alertSettings, ...settings };
    mockDB.setData(db);
    return db.alertSettings;
  },

  async test(): Promise<{ success: boolean; message: string }> {
    await delay(500);

    // Simulate success 90% of the time
    if (Math.random() > 0.1) {
      return {
        success: true,
        message: "Test notification sent successfully!",
      };
    } else {
      throw new Error("Failed to send test notification. Please check your settings.");
    }
  },
};

// Weekly Pulse API
export const weeklyPulseApi = {
  async list(): Promise<WeeklyPulse[]> {
    await delay();
    simulateError();
    return mockDB.getData().weeklyPulses.sort(
      (a, b) => new Date(b.weekOf).getTime() - new Date(a.weekOf).getTime()
    );
  },

  async get(weekOf: string): Promise<WeeklyPulse | null> {
    await delay();
    const pulse = mockDB.getData().weeklyPulses.find((p) => p.weekOf === weekOf);
    return pulse || null;
  },
};

// Users/Members API
export const usersApi = {
  async list(): Promise<User[]> {
    await delay();
    return mockDB.getData().users;
  },

  async invite(email: string, role: "admin" | "member"): Promise<User> {
    await delay();
    simulateError();

    const db = mockDB.getData();
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: email.split("@")[0],
      email,
      role,
    };

    db.users.push(newUser);
    mockDB.setData(db);
    return newUser;
  },

  async remove(id: string): Promise<void> {
    await delay();
    simulateError();

    const db = mockDB.getData();
    db.users = db.users.filter((u) => u.id !== id);
    mockDB.setData(db);
  },

  async updateRole(id: string, role: "admin" | "member"): Promise<User> {
    await delay();
    simulateError();

    const db = mockDB.getData();
    const index = db.users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error("User not found");

    db.users[index].role = role;
    mockDB.setData(db);
    return db.users[index];
  },
};

// Workspace Settings API
export const workspaceSettingsApi = {
  async get(): Promise<WorkspaceSettings> {
    await delay();
    return mockDB.getData().workspaceSettings;
  },

  async update(settings: Partial<WorkspaceSettings>): Promise<WorkspaceSettings> {
    await delay();
    simulateError();

    const db = mockDB.getData();
    db.workspaceSettings = { ...db.workspaceSettings, ...settings };
    mockDB.setData(db);
    return db.workspaceSettings;
  },
};

// Auth API
export const authApi = {
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    await delay(400);

    // Accept any credentials for demo
    const user: User = {
      id: "user-1",
      name: "Demo User",
      email: email || "demo@offerpulse.com",
      role: "admin",
    };

    const token = `demo-token-${Date.now()}`;

    // Store token
    if (typeof window !== "undefined") {
      localStorage.setItem("offerpulse_auth_token", token);
      localStorage.setItem("offerpulse_user", JSON.stringify(user));
      // Set cookie for middleware
      document.cookie = `offerpulse_auth=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
    }

    return { token, user };
  },

  async signup(name: string, email: string, password: string): Promise<{ token: string; user: User }> {
    await delay(400);

    // Accept any credentials for demo
    const user: User = {
      id: "user-1",
      name: name || "Demo User",
      email: email || "demo@offerpulse.com",
      role: "admin",
    };

    const token = `demo-token-${Date.now()}`;

    // Store token
    if (typeof window !== "undefined") {
      localStorage.setItem("offerpulse_auth_token", token);
      localStorage.setItem("offerpulse_user", JSON.stringify(user));
      // Set cookie for middleware
      document.cookie = `offerpulse_auth=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
    }

    return { token, user };
  },

  async logout(): Promise<void> {
    await delay(100);

    if (typeof window !== "undefined") {
      localStorage.removeItem("offerpulse_auth_token");
      localStorage.removeItem("offerpulse_user");
      // Remove cookie
      document.cookie = "offerpulse_auth=; path=/; max-age=0";
    }
  },

  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null;

    try {
      const userStr = localStorage.getItem("offerpulse_user");
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("offerpulse_auth_token");
  },
};

// Reset API
export const resetApi = {
  async resetDemoData(): Promise<void> {
    await delay(300);
    mockDB.reset();
  },
};
