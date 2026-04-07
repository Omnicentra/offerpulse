ALTER TABLE "subscriptions" ADD COLUMN "stripe_schedule_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "pending_plan_id" text;