import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp
} from "drizzle-orm/pg-core";

// ============================================================================
// ENUMS
// ============================================================================

export const roleEnum = pgEnum("role", ["owner", "admin", "member"]);
export const frequencyEnum = pgEnum("frequency", ["1h", "6h", "daily"]);
export const platformEnum = pgEnum("platform", ["shopify", "other"]);
export const confidenceEnum = pgEnum("confidence", ["low", "medium", "high"]);
export const changeEventTypeEnum = pgEnum("change_event_type", [
  "PROMO",
  "SHIPPING",
  "BUNDLE",
  "CART_INCENTIVE",
  "DELIVERY_RETURNS",
]);
export const recommendationStrategyEnum = pgEnum("recommendation_strategy", [
  "MATCH",
  "COUNTER",
  "IGNORE",
  "TEST",
]);
export const recommendationStatusEnum = pgEnum("recommendation_status", [
  "open",
  "done",
  "snoozed",
]);
export const jobStatusEnum = pgEnum("job_status", [
  "pending",
  "running",
  "completed",
  "failed",
]);

// ============================================================================
// AUTH TABLES (Better-auth)
// ============================================================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// ============================================================================
// WORKSPACE TABLES
// ============================================================================

export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull().default("member"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("workspace_members_workspace_idx").on(
      table.workspaceId
    ),
    index("workspace_members_user_idx").on(table.userId),
    unique("workspace_members_unique").on(
      table.workspaceId,
      table.userId
    ),
  ]
);
// ============================================================================
// SUBSCRIPTION TABLES
// ============================================================================

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "incomplete",
]);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    stripeCustomerId: text("stripe_customer_id").notNull().unique(),
    stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
    stripePriceId: text("stripe_price_id").notNull(),
    planId: text("plan_id").notNull(),
    interval: text("interval").notNull(),
    status: subscriptionStatusEnum("status").notNull(),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    currentPeriodStart: timestamp("current_period_start").notNull(),
    currentPeriodEnd: timestamp("current_period_end").notNull(),
    trialStart: timestamp("trial_start"),
    trialEnd: timestamp("trial_end"),
    canceledAt: timestamp("canceled_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("subscriptions_user_idx").on(table.userId),
    index("subscriptions_stripe_customer_idx").on(table.stripeCustomerId),
    index("subscriptions_status_idx").on(table.status),
  ]
);

// ============================================================================
// COMPETITOR MONITORING TABLES
// ============================================================================

export const competitors = pgTable(
  "competitors",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    domain: text("domain").notNull(),
    baseUrl: text("base_url").notNull(),
    platformGuess: platformEnum("platform_guess").notNull().default("other"),
    tags: jsonb("tags").$type<string[]>().default([]),
    isActive: boolean("is_active").notNull().default(true),
    lastSnapshotAt: timestamp("last_snapshot_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("competitors_workspace_idx").on(table.workspaceId),
    index("competitors_is_active_idx").on(table.isActive),
  ]
);

export const monitorSettings = pgTable("monitor_settings", {
  id: text("id").primaryKey(),
  competitorId: text("competitor_id")
    .notNull()
    .references(() => competitors.id, { onDelete: "cascade" })
    .unique(),
  frequency: frequencyEnum("frequency").notNull().default("daily"),
  trackPromos: boolean("track_promos").notNull().default(true),
  trackShipping: boolean("track_shipping").notNull().default(true),
  trackBundles: boolean("track_bundles").notNull().default(true),
  trackCart: boolean("track_cart").notNull().default(true),
  trackDeliveryReturns: boolean("track_delivery_returns")
    .notNull()
    .default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// ============================================================================
// SNAPSHOT TABLES
// ============================================================================

export const snapshots = pgTable(
  "snapshots",
  {
    id: text("id").primaryKey(),
    competitorId: text("competitor_id")
      .notNull()
      .references(() => competitors.id, { onDelete: "cascade" }),
    capturedAt: timestamp("captured_at").defaultNow().notNull(),
    screenshotUrl: text("screenshot_url"),
    // Extracted signals stored as JSONB
    extractedSignals: jsonb("extracted_signals")
      .$type<{
        promoText?: string;
        discountPercent?: number;
        discountCode?: string;
        shippingThreshold?: number;
        shippingText?: string;
        bundleText?: string;
        cartIncentiveText?: string;
        deliveryText?: string;
        returnsText?: string;
        confidence: "low" | "medium" | "high";
      }>()
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("snapshots_competitor_idx").on(table.competitorId),
    index("snapshots_captured_at_idx").on(table.capturedAt),
  ]
);

// ============================================================================
// CHANGE DETECTION TABLES
// ============================================================================

export const changeEvents = pgTable(
  "change_events",
  {
    id: text("id").primaryKey(),
    competitorId: text("competitor_id")
      .notNull()
      .references(() => competitors.id, { onDelete: "cascade" }),
    detectedAt: timestamp("detected_at").defaultNow().notNull(),
    type: changeEventTypeEnum("type").notNull(),
    confidence: confidenceEnum("confidence").notNull(),
    summary: text("summary").notNull(),
    before: jsonb("before").$type<Record<string, any>>(),
    after: jsonb("after").$type<Record<string, any>>(),
    snapshotBeforeId: text("snapshot_before_id").references(() => snapshots.id),
    snapshotAfterId: text("snapshot_after_id").references(() => snapshots.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("change_events_competitor_idx").on(table.competitorId),
    index("change_events_detected_at_idx").on(table.detectedAt),
    index("change_events_type_idx").on(table.type),
    index("change_events_confidence_idx").on(table.confidence),
  ]
);

// ============================================================================
// RECOMMENDATION TABLES
// ============================================================================

export const recommendations = pgTable(
  "recommendations",
  {
    id: text("id").primaryKey(),
    changeEventId: text("change_event_id")
      .notNull()
      .references(() => changeEvents.id, { onDelete: "cascade" }),
    competitorId: text("competitor_id")
      .notNull()
      .references(() => competitors.id, { onDelete: "cascade" }),
    strategy: recommendationStrategyEnum("strategy").notNull(),
    impact: integer("impact").notNull(), // 1-10
    effort: integer("effort").notNull(), // 1-10
    title: text("title").notNull(),
    rationale: text("rationale").notNull(),
    status: recommendationStatusEnum("status").notNull().default("open"),
    snoozedUntil: timestamp("snoozed_until"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("recommendations_competitor_idx").on(table.competitorId),
    index("recommendations_status_idx").on(table.status),
    index("recommendations_impact_idx").on(table.impact),
  ]
);

export const recommendationChecklistItems = pgTable(
  "recommendation_checklist_items",
  {
    id: text("id").primaryKey(),
    recommendationId: text("recommendation_id")
      .notNull()
      .references(() => recommendations.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    done: boolean("done").notNull().default(false),
    order: integer("order").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("checklist_items_recommendation_idx").on(table.recommendationId),
  ]
);

// ============================================================================
// SETTINGS TABLES
// ============================================================================

export const alertSettings = pgTable("alert_settings", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" })
    .unique(),
  emailEnabled: boolean("email_enabled").notNull().default(true),
  slackEnabled: boolean("slack_enabled").notNull().default(false),
  slackWebhookUrl: text("slack_webhook_url"),
  eventTypes: jsonb("event_types")
    .$type<string[]>()
    .default(["PROMO", "SHIPPING", "BUNDLE", "CART_INCENTIVE", "DELIVERY_RETURNS"]),
  minConfidence: confidenceEnum("min_confidence").notNull().default("medium"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const workspaceSettings = pgTable("workspace_settings", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" })
    .unique(),
  defaultFrequency: frequencyEnum("default_frequency")
    .notNull()
    .default("daily"),
  defaultTrackPromos: boolean("default_track_promos")
    .notNull()
    .default(true),
  defaultTrackShipping: boolean("default_track_shipping")
    .notNull()
    .default(true),
  defaultTrackBundles: boolean("default_track_bundles")
    .notNull()
    .default(true),
  defaultTrackCart: boolean("default_track_cart").notNull().default(true),
  defaultTrackDeliveryReturns: boolean("default_track_delivery_returns")
    .notNull()
    .default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// ============================================================================
// WEEKLY PULSE TABLES
// ============================================================================

export const weeklyPulses = pgTable(
  "weekly_pulses",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    weekOf: timestamp("week_of").notNull(), // Start of the week
    totals: jsonb("totals")
      .$type<{
        changes: number;
        promos: number;
        shipping: number;
        bundles: number;
        cart: number;
      }>()
      .notNull(),
    highlights: jsonb("highlights")
      .$type<Array<{ title: string; detail: string }>>()
      .default([]),
    topMoveIds: jsonb("top_move_ids").$type<string[]>().default([]), // Reference to change_events
    recommendationIds: jsonb("recommendation_ids").$type<string[]>().default([]), // Reference to recommendations
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("weekly_pulses_workspace_idx").on(table.workspaceId),
    index("weekly_pulses_week_of_idx").on(table.weekOf),
  ]
);

// ============================================================================
// JOB TRACKING TABLES
// ============================================================================

export const scrapeJobs = pgTable(
  "scrape_jobs",
  {
    id: text("id").primaryKey(),
    competitorId: text("competitor_id")
      .notNull()
      .references(() => competitors.id, { onDelete: "cascade" }),
    status: jobStatusEnum("status").notNull().default("pending"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    error: text("error"),
    snapshotId: text("snapshot_id").references(() => snapshots.id),
    metadata: jsonb("metadata").$type<Record<string, any>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("scrape_jobs_competitor_idx").on(table.competitorId),
    index("scrape_jobs_status_idx").on(table.status),
    index("scrape_jobs_created_at_idx").on(table.createdAt),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  workspaceMembers: many(workspaceMembers),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  competitors: many(competitors),
  weeklyPulses: many(weeklyPulses),
  alertSettings: many(alertSettings),
  workspaceSettings: many(workspaceSettings),
}));

export const workspaceMembersRelations = relations(
  workspaceMembers,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceMembers.workspaceId],
      references: [workspaces.id],
    }),
    user: one(user, {
      fields: [workspaceMembers.userId],
      references: [user.id],
    }),
  })
);

export const competitorsRelations = relations(competitors, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [competitors.workspaceId],
    references: [workspaces.id],
  }),
  monitorSettings: one(monitorSettings),
  snapshots: many(snapshots),
  changeEvents: many(changeEvents),
  recommendations: many(recommendations),
  scrapeJobs: many(scrapeJobs),
}));

export const monitorSettingsRelations = relations(
  monitorSettings,
  ({ one }) => ({
    competitor: one(competitors, {
      fields: [monitorSettings.competitorId],
      references: [competitors.id],
    }),
  })
);

export const snapshotsRelations = relations(snapshots, ({ one, many }) => ({
  competitor: one(competitors, {
    fields: [snapshots.competitorId],
    references: [competitors.id],
  }),
  changeEventsBefore: many(changeEvents, {
    relationName: "snapshotBefore",
  }),
  changeEventsAfter: many(changeEvents, {
    relationName: "snapshotAfter",
  }),
}));

export const changeEventsRelations = relations(
  changeEvents,
  ({ one, many }) => ({
    competitor: one(competitors, {
      fields: [changeEvents.competitorId],
      references: [competitors.id],
    }),
    snapshotBefore: one(snapshots, {
      fields: [changeEvents.snapshotBeforeId],
      references: [snapshots.id],
      relationName: "snapshotBefore",
    }),
    snapshotAfter: one(snapshots, {
      fields: [changeEvents.snapshotAfterId],
      references: [snapshots.id],
      relationName: "snapshotAfter",
    }),
    recommendations: many(recommendations),
  })
);

export const recommendationsRelations = relations(
  recommendations,
  ({ one, many }) => ({
    changeEvent: one(changeEvents, {
      fields: [recommendations.changeEventId],
      references: [changeEvents.id],
    }),
    competitor: one(competitors, {
      fields: [recommendations.competitorId],
      references: [competitors.id],
    }),
    checklistItems: many(recommendationChecklistItems),
  })
);

export const recommendationChecklistItemsRelations = relations(
  recommendationChecklistItems,
  ({ one }) => ({
    recommendation: one(recommendations, {
      fields: [recommendationChecklistItems.recommendationId],
      references: [recommendations.id],
    }),
  })
);

export const alertSettingsRelations = relations(alertSettings, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [alertSettings.workspaceId],
    references: [workspaces.id],
  }),
}));

export const workspaceSettingsRelations = relations(
  workspaceSettings,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceSettings.workspaceId],
      references: [workspaces.id],
    }),
  })
);

export const weeklyPulsesRelations = relations(weeklyPulses, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [weeklyPulses.workspaceId],
    references: [workspaces.id],
  }),
}));

export const scrapeJobsRelations = relations(scrapeJobs, ({ one }) => ({
  competitor: one(competitors, {
    fields: [scrapeJobs.competitorId],
    references: [competitors.id],
  }),
  snapshot: one(snapshots, {
    fields: [scrapeJobs.snapshotId],
    references: [snapshots.id],
  }),
}));
