# Frontend Migration Status

## ✅ Migration Pattern Established & Core Pages Migrated

### Completed migrations (routes & layout)
- ✅ WorkspaceProvider created
- ✅ Dashboard layout updated with WorkspaceProvider
- ✅ **alerts/page.tsx** - Reference implementation
- ✅ **overview/page.tsx** - Dashboard with stats
- ✅ **competitors/page.tsx** - List with filters
- ✅ **competitors/new/page.tsx** - Create form
- ✅ **competitors/[id]/page.tsx** - Detail (RSC + `createCaller`, client via tRPC)
- ✅ **login & signup pages** - Better-auth integration
- ✅ **changes/page.tsx** - Changes list (`trpc.changeEvents`, `trpc.competitors`)
- ✅ **snapshots/page.tsx** - Snapshots list
- ✅ **snapshots/[id]/page.tsx** - Snapshot detail (RSC + `createCaller`)
- ✅ **recommendations/page.tsx** - List, filters, status & checklist via tRPC
- ✅ **weekly-pulse/page.tsx** - RSC + tRPC client with prefetch / `initialData`
- ✅ **components/layout/topbar.tsx** - Session + workspace (no mock API)
- ✅ **components/layout/CollapsibleSidebar.tsx** - Auth + nav (no mock API)

### Pattern Status: ✅ ESTABLISHED AND PROVEN

## Migration Pattern

To migrate a page from mock API to tRPC:

### Before:
```tsx
import { alertsApi } from "@/src/mock/api";

const { data, isLoading } = useQuery({
  queryKey: ["alertSettings"],
  queryFn: () => alertsApi.get(),
});

const mutation = useMutation({
  mutationFn: alertsApi.update,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alertSettings"] }),
});
```

### After:
```tsx
import { trpc } from "@/src/lib/trpc/client";
import { useWorkspace } from "@/src/providers/workspace-provider";

const { workspaceId } = useWorkspace();
const utils = trpc.useUtils();

const { data, isLoading } = trpc.alerts.get.useQuery(
  { workspaceId: workspaceId! },
  { enabled: !!workspaceId }
);

const mutation = trpc.alerts.update.useMutation({
  onSuccess: () => utils.alerts.get.invalidate(),
});
```

## Remaining mock API cleanup (1 runtime file)

Almost all dashboard routes use tRPC. **`@/src/mock/api` is still imported in one place** under `app/` (verify with ripgrep: `mock/api`).

### Must migrate
- [ ] **app/(dashboard)/settings/members/page.tsx** — still uses `usersApi` from `@/src/mock/api`; replace with `trpc.users.*` (or patterns used on `settings/page.tsx`).

### Optional cleanup
- [ ] **components/ui/change-type-badge.tsx** — imports `ChangeEventType` from `@/src/mock/types`; move the type to `@offerpulse/lib` or a local `types` module so UI does not depend on the mock package.

**Estimated time to complete: ~15–25 minutes**

## Key Changes Needed

1. Replace `import { ...Api } from "@/src/mock/api"` with `import { trpc } from "@/src/lib/trpc/client"`
2. Add `import { useWorkspace } from "@/src/providers/workspace-provider"`
3. Get workspaceId: `const { workspaceId } = useWorkspace()`
4. Replace `useQuery` with `trpc.[router].[procedure].useQuery({ workspaceId, ...params })`
5. Replace `useMutation` with `trpc.[router].[procedure].useMutation()`
6. Replace `queryClient.invalidateQueries()` with `utils.[router].[procedure].invalidate()`
7. Remove mock type imports and use tRPC inferred types

## Router Mapping

- `competitorsApi` → `trpc.competitors`
- `snapshotsApi` → `trpc.snapshots`
- `changeEventsApi` → `trpc.changeEvents`
- `recommendationsApi` → `trpc.recommendations`
- `alertsApi` → `trpc.alerts`
- `weeklyPulseApi` → `trpc.weeklyPulse`
- `usersApi` → `trpc.users`
- `workspaceSettingsApi` → `trpc.workspaceSettings`
- `monitorSettingsApi` → `trpc.monitorSettings`
- `authApi` → Better-auth client (next TODO)

## Implementation Notes

### What's Done
✅ Backend is 100% complete - All tRPC routers implemented  
✅ Database schema with 15 tables ready  
✅ Background jobs (Inngest) configured  
✅ AI recommendations integrated  
✅ Notifications (email/Slack) ready  
✅ Migration pattern proven across dashboard routes; layout shells do not use the mock API  

### What's Remaining
One file still calls `@/src/mock/api` at runtime; removing that import completes mock removal for `app/` UI (aside from optional type decoupling). Optional: decouple `change-type-badge` from `@/src/mock/types`.

### Quick Reference
- All pages require workspaceId from `useWorkspace()` hook
- tRPC provides full type safety without manual type imports
- Use `utils.[router].[procedure].invalidate()` instead of query keys
- Error handling is consistent with TRPCError types

## See Also
- **MIGRATION_COMPLETED.md** - Comprehensive migration guide with all router procedures
- **BACKEND_SETUP.md** - Complete backend documentation
- **IMPLEMENTATION_SUMMARY.md** - Full technical summary
