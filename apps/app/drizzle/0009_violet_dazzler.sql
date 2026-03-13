CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'fixed', 'bogo', 'bundle');--> statement-breakpoint
CREATE TYPE "public"."history_field" AS ENUM('price', 'compareAtPrice', 'available', 'variants');--> statement-breakpoint
CREATE TYPE "public"."history_source" AS ENUM('sync', 'manual');--> statement-breakpoint
CREATE TYPE "public"."store_platform" AS ENUM('shopify', 'manual');--> statement-breakpoint
CREATE TYPE "public"."store_sync_status" AS ENUM('idle', 'syncing', 'error');--> statement-breakpoint
CREATE TABLE "own_stores" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"platform" "store_platform" DEFAULT 'manual' NOT NULL,
	"store_url" text,
	"store_name" text DEFAULT 'My Store' NOT NULL,
	"currency" text DEFAULT 'GBP' NOT NULL,
	"shopify_access_token" text,
	"shopify_shop_domain" text,
	"last_synced_at" timestamp,
	"sync_status" "store_sync_status",
	"sync_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "own_stores_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
CREATE TABLE "store_product_history" (
	"id" text PRIMARY KEY NOT NULL,
	"store_product_id" text NOT NULL,
	"field_changed" "history_field" NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"detected_by" "history_source" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_products" (
	"id" text PRIMARY KEY NOT NULL,
	"own_store_id" text NOT NULL,
	"external_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(12, 2) NOT NULL,
	"compare_at_price" numeric(12, 2),
	"available" boolean DEFAULT true NOT NULL,
	"variants" jsonb DEFAULT '[]'::jsonb,
	"images" jsonb DEFAULT '[]'::jsonb,
	"tags" text[] DEFAULT '{}',
	"product_type" text,
	"vendor" text,
	"raw_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_promos" (
	"id" text PRIMARY KEY NOT NULL,
	"own_store_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"discount_type" "discount_type" NOT NULL,
	"discount_value" numeric(12, 2),
	"conditions" jsonb,
	"start_date" timestamp,
	"end_date" timestamp,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspace_settings" ALTER COLUMN "open_router_model" SET DEFAULT 'openai/gpt-4.1-mini';--> statement-breakpoint
ALTER TABLE "own_stores" ADD CONSTRAINT "own_stores_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_product_history" ADD CONSTRAINT "store_product_history_store_product_id_store_products_id_fk" FOREIGN KEY ("store_product_id") REFERENCES "public"."store_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_products" ADD CONSTRAINT "store_products_own_store_id_own_stores_id_fk" FOREIGN KEY ("own_store_id") REFERENCES "public"."own_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_promos" ADD CONSTRAINT "store_promos_own_store_id_own_stores_id_fk" FOREIGN KEY ("own_store_id") REFERENCES "public"."own_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "own_stores_workspace_idx" ON "own_stores" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "own_stores_platform_idx" ON "own_stores" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "store_product_history_product_idx" ON "store_product_history" USING btree ("store_product_id");--> statement-breakpoint
CREATE INDEX "store_product_history_changed_at_idx" ON "store_product_history" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX "store_products_own_store_idx" ON "store_products" USING btree ("own_store_id");--> statement-breakpoint
CREATE INDEX "store_products_external_id_idx" ON "store_products" USING btree ("own_store_id","external_id");--> statement-breakpoint
CREATE INDEX "store_promos_own_store_idx" ON "store_promos" USING btree ("own_store_id");--> statement-breakpoint
CREATE INDEX "store_promos_active_idx" ON "store_promos" USING btree ("active");