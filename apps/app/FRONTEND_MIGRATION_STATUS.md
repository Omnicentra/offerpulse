# Frontend Migration Status

## Completed
- ✅ WorkspaceProvider created
- ✅ Dashboard layout updated with WorkspaceProvider
- ✅ alerts/page.tsx migrated to tRPC

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

## Remaining Pages to Migrate (18 files)

### Auth Pages (2 files) - Will be replaced with Better-auth in next TODO
- [ ] app/(auth)/login/page.tsx
- [ ] app/(auth)/signup/page.tsx

### Dashboard Pages (16 files)
- [ ] app/(dashboard)/overview/page.tsx
- [ ] app/(dashboard)/competitors/page.tsx
- [ ] app/(dashboard)/competitors/new/page.tsx
- [ ] app/(dashboard)/competitors/[id]/page.tsx
- [ ] app/(dashboard)/changes/page.tsx
- [ ] app/(dashboard)/snapshots/page.tsx
- [ ] app/(dashboard)/snapshots/[id]/page.tsx
- [ ] app/(dashboard)/recommendations/page.tsx
- [ ] app/(dashboard)/weekly-pulse/page.tsx
- [ ] app/(dashboard)/settings/page.tsx
- [ ] app/(dashboard)/settings/members/page.tsx
- [ ] app/(dashboard)/settings/billing/page.tsx
- [ ] app/(dashboard)/onboarding/shopify/page.tsx
- [ ] components/layout/topbar.tsx
- [ ] components/layout/CollapsibleSidebar.tsx
- [ ] components/layout/sidebar.tsx (if exists)

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

## Notes

- All pages now require workspaceId from context
- tRPC provides full type safety without manual type imports
- Optimistic updates and invalidation patterns remain the same
- Error handling is consistent with TRPCError types
