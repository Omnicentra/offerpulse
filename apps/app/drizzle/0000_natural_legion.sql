CREATE TYPE "public"."change_event_type" AS ENUM('PROMO', 'SHIPPING', 'BUNDLE', 'CART_INCENTIVE', 'DELIVERY_RETURNS');--> statement-breakpoint
CREATE TYPE "public"."confidence" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."frequency" AS ENUM('1h', '6h', 'daily');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('pending', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('shopify', 'other');--> statement-breakpoint
CREATE TYPE "public"."recommendation_status" AS ENUM('open', 'done', 'snoozed');--> statement-breakpoint
CREATE TYPE "public"."recommendation_strategy" AS ENUM('MATCH', 'COUNTER', 'IGNORE', 'TEST');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"expires_at" timestamp,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alert_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"slack_enabled" boolean DEFAULT false NOT NULL,
	"slack_webhook_url" text,
	"event_types" jsonb DEFAULT '["PROMO","SHIPPING","BUNDLE","CART_INCENTIVE","DELIVERY_RETURNS"]'::jsonb,
	"min_confidence" "confidence" DEFAULT 'medium' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alert_settings_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
CREATE TABLE "change_events" (
	"id" text PRIMARY KEY NOT NULL,
	"competitor_id" text NOT NULL,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"type" "change_event_type" NOT NULL,
	"confidence" "confidence" NOT NULL,
	"summary" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"snapshot_before_id" text,
	"snapshot_after_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitors" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"domain" text NOT NULL,
	"base_url" text NOT NULL,
	"platform_guess" "platform" DEFAULT 'other' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_snapshot_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monitor_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"competitor_id" text NOT NULL,
	"frequency" "frequency" DEFAULT 'daily' NOT NULL,
	"track_promos" boolean DEFAULT true NOT NULL,
	"track_shipping" boolean DEFAULT true NOT NULL,
	"track_bundles" boolean DEFAULT true NOT NULL,
	"track_cart" boolean DEFAULT true NOT NULL,
	"track_delivery_returns" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "monitor_settings_competitor_id_unique" UNIQUE("competitor_id")
);
--> statement-breakpoint
CREATE TABLE "recommendation_checklist_items" (
	"id" text PRIMARY KEY NOT NULL,
	"recommendation_id" text NOT NULL,
	"text" text NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" text PRIMARY KEY NOT NULL,
	"change_event_id" text NOT NULL,
	"competitor_id" text NOT NULL,
	"strategy" "recommendation_strategy" NOT NULL,
	"impact" integer NOT NULL,
	"effort" integer NOT NULL,
	"title" text NOT NULL,
	"rationale" text NOT NULL,
	"status" "recommendation_status" DEFAULT 'open' NOT NULL,
	"snoozed_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scrape_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"competitor_id" text NOT NULL,
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"error" text,
	"snapshot_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"competitor_id" text NOT NULL,
	"captured_at" timestamp DEFAULT now() NOT NULL,
	"screenshot_url" text,
	"extracted_signals" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false,
	"name" text,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "weekly_pulses" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"week_of" timestamp NOT NULL,
	"totals" jsonb NOT NULL,
	"highlights" jsonb DEFAULT '[]'::jsonb,
	"top_move_ids" jsonb DEFAULT '[]'::jsonb,
	"recommendation_ids" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"default_frequency" "frequency" DEFAULT 'daily' NOT NULL,
	"default_track_promos" boolean DEFAULT true NOT NULL,
	"default_track_shipping" boolean DEFAULT true NOT NULL,
	"default_track_bundles" boolean DEFAULT true NOT NULL,
	"default_track_cart" boolean DEFAULT true NOT NULL,
	"default_track_delivery_returns" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_settings_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspaces_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_settings" ADD CONSTRAINT "alert_settings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_events" ADD CONSTRAINT "change_events_competitor_id_competitors_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."competitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_events" ADD CONSTRAINT "change_events_snapshot_before_id_snapshots_id_fk" FOREIGN KEY ("snapshot_before_id") REFERENCES "public"."snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_events" ADD CONSTRAINT "change_events_snapshot_after_id_snapshots_id_fk" FOREIGN KEY ("snapshot_after_id") REFERENCES "public"."snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitor_settings" ADD CONSTRAINT "monitor_settings_competitor_id_competitors_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."competitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_checklist_items" ADD CONSTRAINT "recommendation_checklist_items_recommendation_id_recommendations_id_fk" FOREIGN KEY ("recommendation_id") REFERENCES "public"."recommendations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_change_event_id_change_events_id_fk" FOREIGN KEY ("change_event_id") REFERENCES "public"."change_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_competitor_id_competitors_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."competitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrape_jobs" ADD CONSTRAINT "scrape_jobs_competitor_id_competitors_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."competitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrape_jobs" ADD CONSTRAINT "scrape_jobs_snapshot_id_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_competitor_id_competitors_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."competitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_pulses" ADD CONSTRAINT "weekly_pulses_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_settings" ADD CONSTRAINT "workspace_settings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "change_events_competitor_idx" ON "change_events" USING btree ("competitor_id");--> statement-breakpoint
CREATE INDEX "change_events_detected_at_idx" ON "change_events" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "change_events_type_idx" ON "change_events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "change_events_confidence_idx" ON "change_events" USING btree ("confidence");--> statement-breakpoint
CREATE INDEX "competitors_workspace_idx" ON "competitors" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "competitors_is_active_idx" ON "competitors" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "checklist_items_recommendation_idx" ON "recommendation_checklist_items" USING btree ("recommendation_id");--> statement-breakpoint
CREATE INDEX "recommendations_competitor_idx" ON "recommendations" USING btree ("competitor_id");--> statement-breakpoint
CREATE INDEX "recommendations_status_idx" ON "recommendations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "recommendations_impact_idx" ON "recommendations" USING btree ("impact");--> statement-breakpoint
CREATE INDEX "scrape_jobs_competitor_idx" ON "scrape_jobs" USING btree ("competitor_id");--> statement-breakpoint
CREATE INDEX "scrape_jobs_status_idx" ON "scrape_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "scrape_jobs_created_at_idx" ON "scrape_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "snapshots_competitor_idx" ON "snapshots" USING btree ("competitor_id");--> statement-breakpoint
CREATE INDEX "snapshots_captured_at_idx" ON "snapshots" USING btree ("captured_at");--> statement-breakpoint
CREATE INDEX "weekly_pulses_workspace_idx" ON "weekly_pulses" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "weekly_pulses_week_of_idx" ON "weekly_pulses" USING btree ("week_of");--> statement-breakpoint
CREATE INDEX "workspace_members_workspace_idx" ON "workspace_members" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_members_user_idx" ON "workspace_members" USING btree ("user_id");