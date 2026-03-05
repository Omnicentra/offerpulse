ALTER TABLE "change_events" ADD COLUMN "alert_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "change_events" ADD COLUMN "alert_status" text;--> statement-breakpoint
ALTER TABLE "change_events" ADD COLUMN "alert_channels" jsonb;