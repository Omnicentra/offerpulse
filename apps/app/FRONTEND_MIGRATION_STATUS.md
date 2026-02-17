# Frontend Migration Status

## ✅ Migration Pattern Established & Core Pages Migrated

### Completed Migrations (6 pages)
- ✅ WorkspaceProvider created
- ✅ Dashboard layout updated with WorkspaceProvider
- ✅ **alerts/page.tsx** - Reference implementation
- ✅ **overview/page.tsx** - Dashboard with stats
- ✅ **competitors/page.tsx** - List with filters
- ✅ **competitors/new/page.tsx** - Create form
- ✅ **login & signup pages** - Better-auth integration

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

## Remaining Pages (10 files - Straightforward to Migrate)

All remaining pages follow the exact same pattern demonstrated in the completed migrations.

### Dashboard Pages (8 files)
- [ ] **app/(dashboard)/competitors/[id]/page.tsx** - Detail view (5 min)
  - `competitorsApi.get(id)` → `trpc.competitors.get.useQuery({ id })`
  
- [x] **app/(dashboard)/changes/page.tsx** - Changes list ✅
  - Migrated to tRPC (`trpc.changeEvents.list`, `trpc.competitors.list`)
  - Fixed `useSearchParams()` Suspense boundary for static generation
  
- [ ] **app/(dashboard)/snapshots/page.tsx** - Snapshots list (5 min)
  - `snapshotsApi.list()` → `trpc.snapshots.list.useQuery({ workspaceId })`
  
- [ ] **app/(dashboard)/snapshots/[id]/page.tsx** - Snapshot detail (5 min)
  - `snapshotsApi.get(id)` → `trpc.snapshots.get.useQuery({ id })`
  
- [ ] **app/(dashboard)/recommendations/page.tsx** - Recommendations (10 min)
  - `recommendationsApi.list()` → `trpc.recommendations.list.useQuery({ workspaceId })`
  - Multiple mutations for status updates and checklist items
  
- [ ] **app/(dashboard)/weekly-pulse/page.tsx** - Weekly reports (5 min)
  - `weeklyPulseApi.list()` → `trpc.weeklyPulse.list.useQuery({ workspaceId })`
  
- [ ] **app/(dashboard)/settings/page.tsx** - Workspace settings (5 min)
  - `workspaceSettingsApi.get()` → `trpc.workspaceSettings.get.useQuery({ workspaceId })`
  
- [ ] **app/(dashboard)/settings/members/page.tsx** - Team members (optional)

### Layout Components (2 files)
- [ ] **components/layout/topbar.tsx** - User menu (5 min)
  - `usersApi.getCurrent()` → `trpc.users.getCurrent.useQuery()`
  - `authApi.signOut()` → Better-auth `signOut()`
  
- [ ] **components/layout/CollapsibleSidebar.tsx** - Sidebar (2 min)
  - Add workspace context for workspace name

**Estimated time to complete: 45-60 minutes**

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
✅ Migration pattern proven across 5 diverse pages  

### What's Remaining
The remaining 10 pages are mechanical migrations following the exact established pattern. Each takes 5-10 minutes.

### Quick Reference
- All pages require workspaceId from `useWorkspace()` hook
- tRPC provides full type safety without manual type imports
- Use `utils.[router].[procedure].invalidate()` instead of query keys
- Error handling is consistent with TRPCError types

## See Also
- **MIGRATION_COMPLETED.md** - Comprehensive migration guide with all router procedures
- **BACKEND_SETUP.md** - Complete backend documentation
- **IMPLEMENTATION_SUMMARY.md** - Full technical summary
