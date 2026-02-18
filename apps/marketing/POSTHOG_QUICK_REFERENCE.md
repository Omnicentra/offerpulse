# PostHog Quick Reference

## Environment Setup

```bash
# .env.local (Development)
DOPPLER_ENVIRONMENT=dev
NEXT_PUBLIC_ENVIRONMENT=dev

# Staging Deployment
DOPPLER_ENVIRONMENT=stg
NEXT_PUBLIC_ENVIRONMENT=stg

# Production Deployment
DOPPLER_ENVIRONMENT=prd
NEXT_PUBLIC_ENVIRONMENT=prd
```

## Server-Side Tracking

```typescript
import { captureEvent, identifyUser, shutdownPostHog } from "@/lib/posthog-server";

// Capture event
captureEvent({
  distinctId: "user@example.com",
  event: "event_name",
  properties: {
    custom_prop: "value",
  },
});

// Identify user
identifyUser({
  distinctId: "user@example.com",
  properties: {
    email: "user@example.com",
    name: "John Doe",
  },
});

// Always shutdown
await shutdownPostHog();
```

## Client-Side Tracking

```typescript
import posthog from "posthog-js";

// Capture event (environment automatically added)
posthog.capture("event_name", {
  custom_prop: "value",
});

// Identify user
posthog.identify("user@example.com", {
  email: "user@example.com",
  name: "John Doe",
});
```

## PostHog Filters

```
Production only:        $environment = "prd"
Development only:       $environment = "dev"
Staging only:          $environment = "stg"
Server-side only:      $server_side = true
Client-side only:      $client_side = true
Prod client events:    $environment = "prd" AND $client_side = true
```

## Automatic Properties

Every event includes:
- `$environment`: `"dev"`, `"stg"`, or `"prd"`
- `$server_side`: `true` (server) or undefined (client)
- `$client_side`: `true` (client) or undefined (server)

## Person Profiles

- **Production**: `identified_only` - Only creates profiles after `identify()`
- **Dev/Staging**: `always` - Creates profiles for all users

## Don't Do This ❌

```typescript
// DON'T use getPostHogClient() directly
const posthog = getPostHogClient();
posthog.capture({ ... });

// DON'T forget to shutdown
captureEvent({ ... });
// Missing: await shutdownPostHog();
```

## Do This ✅

```typescript
// DO use wrapper functions
captureEvent({ ... });
identifyUser({ ... });
await shutdownPostHog();
```

## Troubleshooting

**Events missing environment tag?**
1. Check `NEXT_PUBLIC_ENVIRONMENT` is set
2. Restart dev server
3. Clear browser cache

**Wrong environment showing?**
1. Verify environment variables
2. Check deployment config
3. Ensure no hardcoded values

**Person profiles not created in prod?**
- This is expected! Production only creates profiles after `identify()` is called.
