# Dynamic Capture Scheduling

## Overview

This implementation provides two ways to schedule competitor captures:

1. **Static Cron Job** (`scheduleCapturesJob`) - Fixed hourly schedule (fallback/safety net)
2. **Dynamic Scheduled Events** (`scheduleCapturesScheduledJob`) - Per-workspace scheduling with bulk cancellation

## PULSE-56: Monitoring Settings Integration

Monitoring settings are now fully integrated from frontend to backend:

### Creating Competitors
When adding a new competitor, the form now sends monitoring settings:
- **Capture Frequency**: `1h`, `6h`, or `daily`
- **Tracking Preferences**: Promos, shipping, bundles, cart incentives, delivery/returns

These settings are saved to the `monitorSettings` table and control when the scheduler runs captures.

**File**: `apps/app/app/(dashboard)/competitors/new/page.tsx`

### Editing Competitors
Existing competitors' settings can now be edited:
- Click the **Edit** button in the Settings tab
- Modify frequency and tracking preferences
- Click **Save** to persist changes

**File**: `apps/app/app/(dashboard)/competitors/[id]/competitor-detail-client.tsx`

## Dynamic Scheduled Events

The `scheduleCapturesScheduledJob` uses Inngest's scheduled events pattern with bulk cancellation to provide immediate, per-workspace frequency control:

### How It Works

1. **Scheduled Events**: Each workspace gets its own scheduled event sent with a future `ts` timestamp
2. **Per-Workspace Scheduling**: Each workspace runs independently based on its `defaultFrequency` setting
   - `"1h"` → Runs every hour
   - `"6h"` → Runs every 6 hours
   - `"daily"` → Runs once per day at 9 AM UTC
3. **Bulk Cancellation**: When workspace settings change, pending scheduled events are cancelled via Inngest REST API
4. **Immediate Rescheduling**: New scheduled events are immediately sent with updated timestamps
5. **Self-Rescheduling**: After each run, the job sends a new scheduled event for the next run time

### Architecture

```
User changes workspace defaultFrequency
        ↓
[workspaceSettings.update mutation]
        ↓
[Bulk Cancel API: Cancel pending scheduled events]
        ↓
[inngest.send("workspace/schedule-captures", { ts: futureTimestamp })]
        ↓
scheduleCapturesScheduledJob runs at scheduled time
        ↓
[Read workspace settings & competitors]
        ↓
[Execute captures based on monitorSettings]
        ↓
[Send "snapshot/batch-capture" events]
        ↓
[Calculate next run time from defaultFrequency]
        ↓
[Send next scheduled event with ts]
        ↓
[Repeat cycle]
```

### Bulk Cancellation

When workspace frequency changes:

1. **Cancel Old Schedules**: POST to `https://api.inngest.com/v1/cancellations` with:
   - `function_id`: `offerpulse-schedule-captures-scheduled`
   - `if` expression: `event.data.workspaceId == "workspace_xxx"`
   - Time range: Last 7 days (Inngest max sleep duration)

2. **Cleanup Handler**: `cleanupCancelledSchedules` function listens for `inngest/function.cancelled` system events to log cancellations for observability

3. **Send New Schedule**: Immediately send new `workspace/schedule-captures` event with updated `ts` timestamp

## Bootstrap & Initialization

Scheduled events are automatically bootstrapped when workspace settings are first created:

### Automatic Bootstrap

When a workspace accesses settings for the first time (via `workspaceSettings.get`):
1. If no settings exist, default settings are created
2. Initial scheduled event is sent: `workspace/schedule-captures` with calculated `ts`
3. Scheduler begins running on the configured frequency

**File**: `apps/app/src/server/trpc/routers/workspace-settings.ts`

### Fallback Safety Net

The static `scheduleCapturesJob` (hourly cron) still exists as a fallback:
- Runs on fixed hourly schedule regardless of workspace settings
- Acts as safety net if scheduled events are accidentally cancelled
- Both schedulers can coexist - downstream handlers are idempotent

## Configuration

### Per-Competitor Settings
Defined in `monitorSettings` table:
- `frequency` - `"1h" | "6h" | "daily"`
- `trackPromos`, `trackShipping`, `trackBundles`, `trackCart`, `trackDeliveryReturns` - boolean

### Per-Workspace Defaults
Defined in `workspaceSettings` table:
- `defaultFrequency` - Used for new competitors and by dynamic scheduler
- `defaultTrack*` - Used for new competitors
- `openRouterModel` - AI model for recommendations

## Inngest Limitations & Design Decisions

**Inngest Constraint**: Does not support dynamic cron expressions directly. Feature request was closed as "not_planned" in March 2026.

**Solution**: Use scheduled events (with `ts` field) + bulk cancellation API to create dynamic, per-workspace scheduling.

### Key Design Decisions

**Why Scheduled Events over `step.sleepUntil()`?**
- **Immediate effect**: Settings changes take effect instantly via bulk cancellation
- **Explicit control**: Cancellation is explicit via REST API, not reliant on sleep interruption
- **Better observability**: Cleanup handlers provide visibility into cancellations via `inngest/function.cancelled` events
- **Simpler logic**: No complex self-rescheduling loop, each run is independent
- **Workspace isolation**: Each workspace has its own scheduled event, easier to debug

**Trade-offs**:
- ✅ Can change frequency without redeploying job functions
- ✅ Respects per-workspace settings with immediate effect
- ✅ Per-workspace isolation (not all workspaces affected by one workspace's schedule)
- ⚠️ Requires `INNGEST_SIGNING_KEY` for bulk cancellation API (additional secret)
- ⚠️ External API dependency (though Inngest is already core dependency)
- ⚠️ More Inngest events created (one per workspace per schedule cycle)

## Testing

### Create Competitor with Custom Settings
1. Go to "Add Competitor"
2. Select hourly frequency
3. Enable/disable tracking options
4. Submit
5. Verify settings appear in competitor detail page

### Edit Competitor Settings
1. Go to competitor detail page
2. Click Settings tab
3. Click Edit button
4. Change frequency and tracking options
5. Click Save
6. Verify changes reflected immediately

### Change Workspace Frequency (Triggers Rescheduling)
1. Go to workspace settings
2. Change "Default Capture Frequency" (e.g., from daily to hourly)
3. Click Save
4. Verify in Inngest dashboard:
   - Old scheduled events are cancelled (`inngest/function.cancelled` events appear)
   - New scheduled event is sent with updated timestamp
   - `cleanupCancelledSchedules` function logs the cancellation
5. Wait for next scheduled time and verify job runs

## Implementation Files

### New Files Created
- `apps/app/src/server/jobs/inngest-api.ts` - Inngest REST API client for bulk cancellation
- `apps/app/src/server/jobs/functions/schedule-captures-scheduled.ts` - Scheduled event-based scheduler
- `apps/app/src/server/jobs/functions/cleanup-cancelled-schedules.ts` - Cleanup handler for cancelled schedules

### Modified Files
- `apps/app/src/server/trpc/routers/workspace-settings.ts` - Added bulk cancellation + rescheduling logic
- `apps/app/src/server/jobs/client.ts` - Added `workspace/schedule-captures` event type
- `apps/app/src/server/jobs/functions/index.ts` - Exported new functions
- `apps/app/.env.local.example` - Added comment for `INNGEST_SIGNING_KEY`

### Environment Variables

Required for bulk cancellation (optional - system still works without it, with warning):
```bash
INNGEST_SIGNING_KEY=signkey-prod-xxx
```

Get this from Inngest dashboard → Settings → Signing Keys.

## API Reference

### Inngest Bulk Cancellation API

**Endpoint**: `POST https://api.inngest.com/v1/cancellations`

**Headers**:
- `Authorization: Bearer {INNGEST_SIGNING_KEY}`
- `Content-Type: application/json`

**Request Body**:
```json
{
  "app_id": "offerpulse",
  "function_id": "offerpulse-schedule-captures-scheduled",
  "started_after": "2024-01-21T18:23:12.000Z",
  "started_before": "2024-01-22T14:22:42.130Z",
  "if": "event.data.workspaceId == 'workspace_xxx'"
}
```

**Response**:
```json
{
  "id": "01HMRMPE5ZQ4AMNJ3S2N79QGRZ",
  "environment_id": "e03843e1-d2df-419e-9b7b-678b03f7398f",
  "function_id": "offerpulse-schedule-captures-scheduled",
  "started_after": "2024-01-21T18:23:12.000Z",
  "started_before": "2024-01-22T14:22:42.130Z",
  "if": "event.data.workspaceId == 'workspace_xxx'"
}
```

**References**:
- [Inngest Bulk Cancellation Docs](https://www.inngest.com/docs/guides/cancel-running-functions#bulk-cancel-via-the-rest-api)
- [Inngest API Reference](https://api-docs.inngest.com/docs/inngest-api/8gh90chdy0gw4-create-a-cancellation)
- [Cleanup After Cancellation](https://www.inngest.com/docs/examples/cleanup-after-function-cancellation)

## Future Improvements

1. **Manual Reschedule UI**: Add button in workspace settings to manually trigger rescheduling
2. **Monitoring Dashboard**: Show current schedule and next run time per workspace
3. **Scheduled Frequency Limits**: Enforce plan-based frequency limits (e.g., hourly only on Growth plan)
4. **Batch Window Control**: Allow workspace to set custom time for daily captures (currently fixed at 9 AM UTC)
5. **Cancellation Metrics**: Track cancellation frequency and alert if excessive (possible bug indicator)
