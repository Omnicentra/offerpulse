CREATE TABLE "shopify_oauth_states" (
	"state" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"shop" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shopify_oauth_states" ADD CONSTRAINT "shopify_oauth_states_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "shopify_oauth_states_expires_idx" ON "shopify_oauth_states" USING btree ("expires_at");