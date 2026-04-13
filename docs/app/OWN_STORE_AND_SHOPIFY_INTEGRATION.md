# Own Store Configuration & Shopify Integration

This document describes how workspace owners configure their own e-commerce store in OfferPulse, and how the Shopify integration provides automated sync of products and promotions. The system uses this “own store” context to personalize AI recommendations by comparing competitor offers against the user’s pricing.

---

## Overview

- **One store per workspace.** Each workspace has a single “own store” record (`own_stores`). It can be manual-only or connected to Shopify.
- **Manual configuration** (store name, URL, currency, products, promos) is available on **all plans**.
- **Shopify integration** (OAuth connect, automated sync of products and price rules) is a **Growth and Agency** feature. Users with the Better Auth **admin** role can use Shopify integration regardless of plan.
- **AI recommendations** always compare competitor offers against the user’s store when store context (products and/or promos) is available; recommendations are marked as “Personalized for your store” in the UI when that context exists.

---

## Manual vs Shopify

| Capability | Manual (all plans) | Shopify (Growth / Agency, or admin) |
|------------|--------------------|-------------------------------------|
| Store name, URL, currency | ✅ | ✅ (can be overwritten by sync metadata) |
| Add/edit/delete products | ✅ | ✅ (sync overwrites from Shopify) |
| Add/edit/delete promos | ✅ | ✅ (sync overwrites from price rules) |
| Automated sync | ❌ | ✅ (products.json + Admin API price rules) |
| Product change history | ✅ (manual edits) | ✅ (delta on each sync) |
| Sync frequency | — | Growth: 6h, Agency: 3h (scheduled job) |

**Plan gating:** `shopifyIntegrationProcedure` in `apps/app/src/server/trpc/trpc.ts` allows access if the user’s subscription `planId` is `growth` or `agency`, **or** if the user has Better Auth `role === "admin"`. The store settings UI shows an upgrade prompt for Starter users and exposes “Connect Shopify” only when the user has access.

---

## Database Schema

All tables live in `apps/app/src/server/db/schema.ts`.

### Tables

- **`own_stores`**  
  One row per workspace. Fields include: `workspace_id`, `platform` (`manual` | `shopify`), `store_name`, `store_url`, `currency`, and for Shopify: `shopify_access_token` (encrypted), `shopify_shop_domain`, `last_synced_at`, `sync_status`, `sync_error`.

- **`store_products`**  
  Products for the workspace’s own store. Key fields: `own_store_id`, `external_id` (e.g. Shopify variant ID or manual nanoid), `name`, `description`, `price`, `compare_at_price`, `available`, `variants` (JSON), `images` (JSON), `tags`, `product_type`, `vendor`, `raw_data`.

- **`store_promos`**  
  Promotions for the own store. Key fields: `own_store_id`, `name`, `description`, `discount_type` (enum: percentage, fixed, bogo, bundle), `discount_value`, `conditions` (JSON), `start_date`, `end_date`, `active`.

- **`store_product_history`**  
  Delta-only change log for store products (price, compareAtPrice, available, variants). Used for history APIs and pruning. Fields: `store_product_id`, `field_changed`, `old_value`, `new_value`, `changed_at`, `detected_by` (`sync` | `manual`).

- **`shopify_oauth_states`**  
  OAuth state per install: `state` (PK), `workspace_id`, `shop`, `expires_at`. Used during Shopify OAuth to prevent CSRF and map callback to workspace.

### Enums (relevant)

- `store_platform`: `manual`, `shopify`
- `store_sync_status`: `idle`, `syncing`, `error`
- `discount_type`: `percentage`, `fixed`, `bogo`, `bundle`
- `history_field`: `price`, `compareAtPrice`, `available`, `variants`
- `history_source`: `sync`, `manual`

---

## tRPC API

### Own store router (`ownStore`)

- **`ownStore.get`** – Get or create the workspace’s store (defaults: platform `manual`, store name “My Store”, currency GBP).
- **`ownStore.update`** – Update store name, URL, currency.
- **`ownStore.products.list`** / **`create`** / **`update`** / **`delete`** – CRUD for store products (all via `workspaceProcedure`).
- **`ownStore.promos.list`** / **`create`** / **`update`** / **`delete`** – CRUD for store promos.
- **`ownStore.getHistory`** – List change history for a product.
- **`ownStore.getPriceHistory`** – Price change history for a product within a given number of days.

All own-store procedures use `workspaceProcedure` (active subscription + workspace membership). No separate plan check for manual store features.

### Shopify router (`shopify`)

- **`shopify.triggerSync`** – Calls `shopifyIntegrationProcedure`; sends Inngest event `shopify/store.sync` for the workspace. Fails if store is not connected to Shopify.
- **`shopify.disconnect`** – Uses `workspaceProcedure`; clears Shopify token and domain, sets platform back to `manual`. Does not delete products/promos (they remain as manual data).

---

## Shopify OAuth Flow

1. **Start** – `GET/POST` `apps/app/app/api/shopify/auth/start/route.ts`  
   Query/body: `shop` (myshopify domain), `workspaceId`. Validates env (`SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`), session, workspace membership, and plan (Growth/Agency or admin). Generates a unique `state`, stores it in `shopify_oauth_states` with `workspaceId` and `shop`, then redirects to Shopify’s OAuth authorize URL.

2. **Callback** – `GET` `apps/app/app/api/shopify/auth/callback/route.ts`  
   Query: `code`, `state`, `shop`, `hmac`. Verifies HMAC, looks up `state` in `shopify_oauth_states`, exchanges `code` for access token, encrypts the token (AES-256-GCM with key derived from `BETTER_AUTH_SECRET`), then creates or updates `own_stores` with `platform: 'shopify'`, `shopify_shop_domain`, and encrypted `shopify_access_token`. Deletes the OAuth state row and triggers `shopify/store.sync`. Redirects to store settings with success or error query params.

Token handling (encrypt/decrypt) lives in `apps/app/src/server/shopify/oauth.ts`.

---

## Shopify Sync (Inngest)

### Event and job

- **Event:** `shopify/store.sync` with `data: { workspaceId: string }`.
- **Job:** `sync-shopify-store` in `apps/app/src/server/jobs/functions/sync-shopify-store.ts`.

### Steps

1. Load store by `workspaceId`; ensure `platform === 'shopify'` and token/shop domain exist. Set `sync_status = 'syncing'`.
2. Decrypt access token; fetch **products** from the store’s public `products.json` (paginated) via `apps/app/src/server/shopify/products-json.ts`.
3. Fetch **price rules** from Shopify Admin API via `apps/app/src/server/shopify/admin-api.ts` (with rate limit and link-header pagination).
4. **Update database:**  
   - **Products:** For each incoming product (after transforming via `sync-utils`), either update existing `store_products` by ID/externalId and append to `store_product_history` for each detected change (price, compareAtPrice, available, variants), or insert new products. Remove store products that no longer exist in the feed.  
   - **Promos:** Replace all `store_promos` for the store with the transformed price rules.  
   - Set `sync_status`, `last_synced_at`, and optionally `sync_error` on `own_stores`.

Change detection is in `apps/app/src/server/shopify/change-detector.ts`; transformation from Shopify shapes to DB in `apps/app/src/server/shopify/sync-utils.ts`.

### Scheduled syncs

- **Job:** `schedule-shopify-syncs` in `apps/app/src/server/jobs/functions/schedule-shopify-syncs.ts`.  
- **Schedule:** Cron every 3 hours.  
- For each Shopify-connected store (idle), the job looks up a workspace member’s subscription to get `planId`, then uses `packages/lib/pricing.ts` to get `syncFrequencyHours` (Growth: 6, Agency: 3). If `last_synced_at` is older than that interval, it sends `shopify/store.sync` for that workspace.

### History pruning

- **Job:** `prune-store-history` in `apps/app/src/server/jobs/functions/prune-store-history.ts`.  
- **Schedule:** Daily (e.g. 02:00). Deletes `store_product_history` rows older than 90 days.

---

## AI Recommendations and Store Context

- **Input:** `generateRecommendation` in `apps/app/src/server/ai/index.ts` accepts optional `storeContext: StoreContext | null` with `storeName`, `currency`, `products[]`, `promos[]`.
- **Prompt:** When `storeContext` is present, the system prompt includes a “YOUR STORE CONTEXT” section and instructs the model to compare competitor offers against the user’s store pricing.
- **Job:** The Inngest job that generates recommendations (`apps/app/src/server/jobs/functions/generate-recommendations.ts`) loads the workspace’s `own_stores`, `store_products`, and `store_promos`, builds `StoreContext`, and passes it into `generateRecommendation`.
- **UI:** Recommendation cards can show a “Personalized for your store” badge when the workspace has store context (products or Shopify connected). Store context card and price comparison badges appear on competitor detail and related views (see `apps/app/components/store-context-card.tsx`, `price-comparison-badge.tsx`).

---

## UI and Routes

- **Store settings:** `apps/app/app/(dashboard)/settings/store/page.tsx` (server) and `store-client.tsx` (client). Fetches store and subscription; shows store details form, products table, promos table, and Shopify connect/disconnect/sync section (with upgrade prompt for Starter non-admins).
- **Settings nav:** “Your store” entry in `apps/app/app/(dashboard)/settings/page.tsx` links to `/settings/store`.
- **Competitor detail:** Store context card and personalized recommendation badges are used in `apps/app/app/(dashboard)/competitors/[id]/competitor-detail-client.tsx`.

---

## Environment Variables (Dashboard App)

For Shopify integration, the dashboard app expects (see `apps/app/env.ts`):

- **`SHOPIFY_API_KEY`** – Required for OAuth (app key from Shopify Partner dashboard).
- **`SHOPIFY_API_SECRET`** – Optional in schema but **required in production** for HMAC verification in the OAuth callback.
- **`SHOPIFY_SCOPES`** – Optional; default `read_products,read_inventory,read_price_rules,read_discounts`.

Token encryption uses **`BETTER_AUTH_SECRET`** (must be at least 32 characters). Do not expose it to the client.

---

## Summary

| Area | Location / behavior |
|------|----------------------|
| One store per workspace | `own_stores.workspace_id` unique |
| Manual store (all plans) | `ownStore` router; no plan check |
| Shopify (Growth/Agency or admin) | `shopifyIntegrationProcedure`; `shopify` router + OAuth + sync job |
| OAuth | `/api/shopify/auth/start`, `/api/shopify/auth/callback`; state in DB; token encrypted at rest |
| Sync | Inngest `shopify/store.sync`; products.json + Admin price rules; delta history; scheduled by plan |
| History | `store_product_history`; pruned after 90 days |
| AI | `StoreContext` in recommendation job and prompt; “Personalized for your store” in UI |
| Config | This document; `packages/lib/pricing.ts` for plan limits; `env.ts` for Shopify env vars |
