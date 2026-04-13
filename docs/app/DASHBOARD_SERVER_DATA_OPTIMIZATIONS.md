# Dashboard: server-side data & TanStack Query optimizations

This note captures recommended optimizations when moving dashboard routes back to **client-first** data loading (tRPC + TanStack Query in the browser) or when reintroducing **RSC prefetch + dehydration** later. Use it as a checklist for faster server renders and clearer caching boundaries.

## Context

- **Client pages** (`use client`): data loads after paint via `useQuery` + HTTP `/api/trpc`. Session/workspace flow through `WorkspaceProvider` and Better Auth client.
- **Server pages** (RSC): `headers()` + `auth.api.getSession()`, then `prefetchQuery` + `HydrateClient` / `HydrationBoundary`. Same queries hydrate on the client if keys and transformers match.

## 1. Deduplicate session resolution (high impact)

**Issue:** `auth.api.getSession({ headers })` can run multiple times per request: once in a layout/page, again inside `createTRPCContext` for server-side tRPC, and again per prefetch if context is not shared.

**Recommendation:** Wrap session loading in React’s `cache()` (per-request memoization) and use that single helper from both the page and `createTRPCContext`.

```ts
// Example shape (implement in your auth module)
import { cache } from "react";
import { headers } from "next/headers";

export const getSession = cache(async () => {
  const h = await headers();
  return auth.api.getSession({ headers: h });
});
```

**Why:** Better Auth hits the database for session validation. One round-trip per request instead of two or three materially cuts RSC time.

## 2. Avoid redundant middleware work on parallel prefetches (medium impact)

**Issue:** `workspaceProcedure` (and layers below it) run **per procedure call**: subscription row, workspace membership, etc. Two `prefetchQuery` calls in `Promise.all` still execute that stack twice.

**Options:**

- Wrap stable lookups (e.g. subscription for `userId`, membership for `userId` + `workspaceId`) in `cache()` keyed by inputs for the duration of the request.
- Or prefetch via a single router procedure that returns a bundle `{ competitors, changes }` for that page (one middleware pass).
- Or accept double cost where queries are cheap.

## 3. `headers()` / cookies and Next.js Cache Components

**Issue:** File-level or function-level `'use cache'` cannot call `headers()`, `cookies()`, or uncached auth. Session must be resolved **outside** any `'use cache'` scope; only pass serializable arguments into cached helpers.

**Reference:** [Cache Components](https://nextjs.org/docs/app/getting-started/cache-components), [`use cache`](https://nextjs.org/docs/app/api-reference/directives/use-cache).

## 4. TanStack Query SSR / hydration (best practices)

**Already aligned in this repo:**

- Shared `QueryClient` factory (`makeQueryClient`) with matching `dehydrate.serializeData` / `hydrate.deserializeData` (superjson).
- Server prefetch + `HydrationBoundary` + client `useQuery` with the same `queryOptions` / keys.

**Optional improvements:**

- Prefer **`useSuspenseQuery`** on routes that are always prefetched so the tree assumes cached data and Suspense boundaries own loading states ([Advanced SSR](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)).
- Keep **`staleTime`** high enough on the server-prefetched queries to avoid an immediate refetch on mount (you already use ~60s defaults).

## 5. Serialization cost

**Issue:** Dehydrating large lists (competitors + change events) increases HTML payload and CPU on the server.

**Mitigations:**

- Prefetch only what the first paint needs; load the rest on the client.
- Or paginate / trim fields at the router for list views.

## 6. Client `new Date()` and Cache Components / PPR

**Issue:** With `cacheComponents: true`, client components that call `new Date()` during render may require a **Suspense boundary** above them (or deferred time reads). Example: subscription period checks in a provider.

**Mitigations:** Server-owned `Suspense` around the client shell, or defer “now” to `useEffect` / `useSyncExternalStore` with a stable server snapshot where appropriate.

**Reference:** [next-prerender-current-time-client](https://nextjs.org/docs/messages/next-prerender-current-time-client).

## 7. Layout-level session + `workspaceId` (structural)

**Idea:** Resolve the session once in a **server** dashboard layout, pass `workspaceId` into children as props or a small server wrapper, so each page does not repeat `getSession` + redirect logic. Client subtree still uses `useWorkspace()` for switches if you sync from props once.

## 8. When client-only pages are “faster”

Client-first routes often **feel** faster because:

- First paint is a shell or skeleton without waiting for DB + dehydrate.
- Work is moved to `/api/trpc` after paint.

They can still pay the **same** DB + middleware cost in the API; you trade **TTFB / full HTML** for **progressive** loading. Measure both **LCP** and **time-to-interactive** when comparing strategies.

---

*Last updated for OfferPulse dashboard (`apps/app`). Adjust file paths if the app layout changes.*
