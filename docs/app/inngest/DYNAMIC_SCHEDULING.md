# Dynamic Capture Scheduling

## Overview

This implementation provides two ways to schedule competitor captures:

1. **Static Cron Job** (`scheduleCapturesJob`) - Fixed hourly schedule
2. **Dynamic Scheduler** (`scheduleCapturesDynamicJob`) - Respects workspace settings

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

## Dynamic Cron Scheduling

The `scheduleCapturesDynamicJob` job respects the workspace-level `defaultFrequency` setting to determine how often to run:

### How It Works

1. **Event-Driven**: Triggered by `cron/schedule-captures-dynamic` event
2. **Intelligent Scheduling**: Calculates the minimum frequency across all workspaces
   - If any workspace has hourly monitoring → runs every hour
   - If fastest is 6-hour → runs every 6 hours
   - If all are daily → runs once per day at 9 AM UTC
3. **Self-Rescheduling**: Uses `step.sleepUntil()` to reschedule itself based on calculated next run time
4. **Setting Changes**: When `defaultFrequency` changes in workspace settings, a new cycle is triggered immediately

### Architecture

```
workspace_settings (defaultFrequency)
        ↓
[Workspace Settings Update]
        ↓
[inngest.send("cron/schedule-captures-dynamic")]
        ↓
scheduleCapturesDynamicJob
        ↓
[Read workspace settings and calculate next run]
        ↓
[Determine capture schedule from monitorSettings]
        ↓
[Send "snapshot/batch-capture" events]
        ↓
[step.sleepUntil(nextRunTime)]
        ↓
[Self-reschedule by sending event again]
```

## Bootstrap/Fallback

To ensure the dynamic scheduler is always running, you should also keep the static `scheduleCapturesJob` with a cron trigger, or add a bootstrap mechanism (e.g., a manual trigger in the UI).

### Option 1: Keep Both (Recommended)
- `scheduleCapturesJob` runs on fixed hourly cron (acts as safety net)
- `scheduleCapturesDynamicJob` runs based on workspace settings (can be more/less frequent)
- Both call the same downstream `snapshot/batch-capture` event handler
- Handler is idempotent, so duplication is safe

### Option 2: Replace with Bootstrap Event
Add a trigger in workspace creation or startup:
```typescript
// On workspace creation or app startup
await inngest.send({
  name: "cron/schedule-captures-dynamic",
  data: {},
});
```

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

**Solution**: Use `step.sleepUntil()` with self-rescheduling pattern to create dynamic interval-based scheduling without requiring separate function definitions for each interval.

**Trade-offs**:
- ✅ Can change frequency without redeploying job functions
- ✅ Respects per-workspace settings
- ⚠️ Schedule changes take effect only when the current sleep completes
- ⚠️ If all sleeps are cancelled, need a bootstrap mechanism to restart

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

### Trigger Dynamic Scheduler
1. Go to workspace settings
2. Change "Default Capture Frequency"
3. Click Save
4. Verify dynamic scheduler is triggered (check Inngest logs)

## Future Improvements

1. **UI for Bootstrap**: Add button to manually trigger `scheduleCapturesDynamicJob`
2. **Monitoring Dashboard**: Show current schedule and next run time per workspace
3. **Scheduled Frequency Limits**: Enforce plan-based frequency limits (e.g., hourly only on Growth plan)
4. **Batch Window Control**: Allow workspace to set custom time for daily captures (currently fixed at 9 AM UTC)
