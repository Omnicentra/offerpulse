CREATE TYPE "public"."snapshot_capture_source" AS ENUM('product_capture', 'marketing_tool');--> statement-breakpoint
ALTER TABLE "snapshots" ADD COLUMN "capture_source" "snapshot_capture_source" DEFAULT 'product_capture' NOT NULL;--> statement-breakpoint
ALTER TABLE "snapshots" ADD COLUMN "marketing_tool_payload" jsonb;