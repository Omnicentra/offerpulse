import { relations, sql } from "drizzle-orm";
import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex
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
export const firecrawlChangeStatusEnum = pgEnum("firecrawl_change_status", [
  "new",
  "same",
  "changed",
  "removed",
]);
export const firecrawlVisibilityEnum = pgEnum("firecrawl_visibility", [
  "visible",
  "hidden",
]);
export const diffTypeEnum = pgEnum("diff_type", ["git-diff", "json", "manual"]);
export const storePlatformEnum = pgEnum("store_platform", ["shopify", "manual"]);
export const storeSyncStatusEnum = pgEnum("store_sync_status", [
  "idle",
  "syncing",
  "error",
]);
export const discountTypeEnum = pgEnum("discount_type", [
  "percentage",
  "fixed",
  "bogo",
  "bundle",
]);
export const historyFieldEnum = pgEnum("history_field", [
  "price",
  "compareAtPrice",
  "available",
  "variants",
]);
export const historySourceEnum = pgEnum("history_source", ["sync", "manual"]);
export const snapshotCaptureSourceEnum = pgEnum("snapshot_capture_source", [
  "product_capture",
  "marketing_tool",
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
  // Better-auth admin plugin fields
  role: text("role").notNull().default("user"),
  banned: boolean("banned").notNull().default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  // Onboarding tour state
  hasSeenTour: boolean("has_seen_tour").notNull().default(false),
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
  // Better-auth admin plugin field
  impersonatedBy: text("impersonated_by"),
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
    planId: text("plan_id", { enum: ["starter", "growth", "agency"] }).notNull(),
    interval: text("interval").notNull(),
    status: subscriptionStatusEnum("status").notNull(),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    currentPeriodStart: timestamp("current_period_start").notNull(),
    currentPeriodEnd: timestamp("current_period_end").notNull(),
    trialStart: timestamp("trial_start"),
    trialEnd: timestamp("trial_end"),
    canceledAt: timestamp("canceled_at"),
    /** Stripe Subscription Schedule id when a plan change is scheduled for period end */
    stripeScheduleId: text("stripe_schedule_id"),
    /** Plan id the subscription will switch to at period end (from schedule phase 2) */
    pendingPlanId: text("pending_plan_id", {
      enum: ["starter", "growth", "agency"],
    }),
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
    uniqueIndex("subscriptions_one_active_per_user")
      .on(table.userId)
      .where(sql`"status" in ('active', 'trialing')`),
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
    // Extracted signals stored as JSONB (legacy + derived from Firecrawl)
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
    // Firecrawl change tracking fields
    markdown: text("markdown"),
    firecrawlChangeStatus: firecrawlChangeStatusEnum("firecrawl_change_status"),
    firecrawlPreviousScrapeAt: timestamp("firecrawl_previous_scrape_at"),
    firecrawlVisibility: firecrawlVisibilityEnum("firecrawl_visibility"),
    firecrawlTag: text("firecrawl_tag"),
    firecrawlDiff: jsonb("firecrawl_diff").$type<Record<string, unknown>>(),
    firecrawlJson: jsonb("firecrawl_json").$type<
      Record<string, { previous?: unknown; current?: unknown }>
    >(),
    captureSource: snapshotCaptureSourceEnum("capture_source")
      .notNull()
      .default("product_capture"),
    /** Trimmed free-tool JSON when captureSource is marketing_tool */
    marketingToolPayload: jsonb("marketing_tool_payload").$type<
      Record<string, unknown>
    >(),
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
    diffType: diffTypeEnum("diff_type"),
    fieldsChanged: text("fields_changed").array(),
    alertSentAt: timestamp("alert_sent_at"),
    alertStatus: text("alert_status"), // 'pending' | 'sent' | 'failed' | 'filtered'
    alertChannels: jsonb("alert_channels").$type<string[]>(),
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
  slackTeamId: text("slack_team_id"),
  slackTeamName: text("slack_team_name"),
  slackAccessToken: text("slack_access_token"),
  slackBotUserId: text("slack_bot_user_id"),
  slackChannel: text("slack_channel"),
  slackChannelName: text("slack_channel_name"),
  captureNotificationsEnabled: boolean("capture_notifications_enabled")
    .notNull()
    .default(true),
  /** When true, send the weekly pulse digest via email/Slack when the job runs (Mon). */
  weeklyPulseAlertsEnabled: boolean("weekly_pulse_alerts_enabled")
    .notNull()
    .default(false),
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
  /** OpenRouter model ID (e.g. openai/gpt-4.1-mini, x-ai/grok-4.1-fast, google/gemini-3.1-pro-preview). Null = use app default. */
  openRouterModel: text("open_router_model", { enum: ["openai/gpt-4.1-mini", "x-ai/grok-4.1-fast", "google/gemini-3.1-pro-preview"] }).default("openai/gpt-4.1-mini"),
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
// OWN STORE TABLES
// ============================================================================

export const ownStores = pgTable(
  "own_stores",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" })
      .unique(),
    platform: storePlatformEnum("platform").notNull().default("manual"),
    storeUrl: text("store_url"),
    storeName: text("store_name").notNull().default("My Store"),
    currency: text("currency").notNull().default("GBP"),
    shopifyAccessToken: text("shopify_access_token"),
    shopifyShopDomain: text("shopify_shop_domain"),
    lastSyncedAt: timestamp("last_synced_at"),
    syncStatus: storeSyncStatusEnum("sync_status"),
    syncError: text("sync_error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("own_stores_workspace_idx").on(table.workspaceId),
    index("own_stores_platform_idx").on(table.platform),
  ]
);

export const storeProducts = pgTable(
  "store_products",
  {
    id: text("id").primaryKey(),
    ownStoreId: text("own_store_id")
      .notNull()
      .references(() => ownStores.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    price: decimal("price", { precision: 12, scale: 2 }).notNull(),
    compareAtPrice: decimal("compare_at_price", { precision: 12, scale: 2 }),
    available: boolean("available").notNull().default(true),
    variants: jsonb("variants").$type<Record<string, unknown>[]>().default([]),
    images: jsonb("images").$type<Array<{ src: string; alt?: string }>>().default([]),
    tags: text("tags").array().default([]),
    productType: text("product_type"),
    vendor: text("vendor"),
    rawData: jsonb("raw_data").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("store_products_own_store_idx").on(table.ownStoreId),
    index("store_products_external_id_idx").on(table.ownStoreId, table.externalId),
  ]
);

export const storePromos = pgTable(
  "store_promos",
  {
    id: text("id").primaryKey(),
    ownStoreId: text("own_store_id")
      .notNull()
      .references(() => ownStores.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    discountType: discountTypeEnum("discount_type").notNull(),
    discountValue: decimal("discount_value", { precision: 12, scale: 2 }),
    conditions: jsonb("conditions").$type<Record<string, unknown>>(),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("store_promos_own_store_idx").on(table.ownStoreId),
    index("store_promos_active_idx").on(table.active),
  ]
);

export const shopifyOauthStates = pgTable(
  "shopify_oauth_states",
  {
    state: text("state").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    shop: text("shop").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("shopify_oauth_states_expires_idx").on(table.expiresAt),
  ]
);

export const storeProductHistory = pgTable(
  "store_product_history",
  {
    id: text("id").primaryKey(),
    storeProductId: text("store_product_id")
      .notNull()
      .references(() => storeProducts.id, { onDelete: "cascade" }),
    fieldChanged: historyFieldEnum("field_changed").notNull(),
    oldValue: jsonb("old_value").$type<unknown>(),
    newValue: jsonb("new_value").$type<unknown>(),
    changedAt: timestamp("changed_at").defaultNow().notNull(),
    detectedBy: historySourceEnum("detected_by").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("store_product_history_product_idx").on(table.storeProductId),
    index("store_product_history_changed_at_idx").on(table.changedAt),
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

export const workspacesRelations = relations(workspaces, ({ many, one }) => ({
  members: many(workspaceMembers),
  competitors: many(competitors),
  weeklyPulses: many(weeklyPulses),
  alertSettings: many(alertSettings),
  workspaceSettings: many(workspaceSettings),
  ownStore: one(ownStores),
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

export const ownStoresRelations = relations(ownStores, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [ownStores.workspaceId],
    references: [workspaces.id],
  }),
  products: many(storeProducts),
  promos: many(storePromos),
}));

export const storeProductsRelations = relations(storeProducts, ({ one, many }) => ({
  ownStore: one(ownStores, {
    fields: [storeProducts.ownStoreId],
    references: [ownStores.id],
  }),
  history: many(storeProductHistory),
}));

export const storePromosRelations = relations(storePromos, ({ one }) => ({
  ownStore: one(ownStores, {
    fields: [storePromos.ownStoreId],
    references: [ownStores.id],
  }),
}));

export const storeProductHistoryRelations = relations(
  storeProductHistory,
  ({ one }) => ({
    storeProduct: one(storeProducts, {
      fields: [storeProductHistory.storeProductId],
      references: [storeProducts.id],
    }),
  })
);
