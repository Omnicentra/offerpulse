CREATE TYPE "public"."diff_type" AS ENUM('git-diff', 'json', 'manual');--> statement-breakpoint
CREATE TYPE "public"."firecrawl_change_status" AS ENUM('new', 'same', 'changed', 'removed');--> statement-breakpoint
CREATE TYPE "public"."firecrawl_visibility" AS ENUM('visible', 'hidden');--> statement-breakpoint
ALTER TABLE "change_events" ADD COLUMN "diff_type" "diff_type";--> statement-breakpoint
ALTER TABLE "change_events" ADD COLUMN "fields_changed" text[];--> statement-breakpoint
ALTER TABLE "snapshots" ADD COLUMN "markdown" text;--> statement-breakpoint
ALTER TABLE "snapshots" ADD COLUMN "firecrawl_change_status" "firecrawl_change_status";--> statement-breakpoint
ALTER TABLE "snapshots" ADD COLUMN "firecrawl_previous_scrape_at" timestamp;--> statement-breakpoint
ALTER TABLE "snapshots" ADD COLUMN "firecrawl_visibility" "firecrawl_visibility";--> statement-breakpoint
ALTER TABLE "snapshots" ADD COLUMN "firecrawl_tag" text;--> statement-breakpoint
ALTER TABLE "snapshots" ADD COLUMN "firecrawl_diff" jsonb;--> statement-breakpoint
ALTER TABLE "snapshots" ADD COLUMN "firecrawl_json" jsonb;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_unique" UNIQUE("workspace_id","user_id");