# PostHog Environment Separation Setup

This document explains how PostHog is configured to separate events across different environments (dev, stg, prd).

## Overview

PostHog events are automatically tagged with environment information to ensure that development, staging, and production data remain separate. This allows you to:

- Filter events by environment in PostHog dashboards
- Prevent test data from polluting production analytics
- Track environment-specific metrics separately
- Use different person profile strategies per environment

## Environment Variables

### Server-Side (Backend)

The server uses `DOPPLER_ENVIRONMENT` to determine the current environment:

```bash
DOPPLER_ENVIRONMENT=dev  # Options: dev, stg, prd
```

This is defined in `env.ts` and validated as one of: `"dev"`, `"stg"`, or `"prd"`.

### Client-Side (Frontend)

The client uses `NEXT_PUBLIC_ENVIRONMENT` to determine the current environment:

```bash
NEXT_PUBLIC_ENVIRONMENT=dev  # Options: dev, stg, prd
```

This must be set in your `.env.local` file and any deployment environment variables.

## Configuration Files

### 1. Environment Schema (`env.ts`)

Added validation for both server and client environment variables:

```typescript
server: {
  DOPPLER_ENVIRONMENT: z.enum(["dev", "stg", "prd"]).default("dev"),
  // ... other server vars
},
client: {
  NEXT_PUBLIC_ENVIRONMENT: z.enum(["dev", "stg", "prd"]).default("dev"),
  // ... other client vars
}
```

### 2. Server-Side PostHog (`lib/posthog-server.ts`)

The server-side PostHog client automatically:

- Uses `DOPPLER_ENVIRONMENT` to determine the environment
- Sets `personProfilesMode` based on environment (production uses `"identified_only"`, others use `"always"`)
- Provides wrapper functions that automatically add environment tags to all events

**Wrapper Functions:**

```typescript
// Use these instead of direct PostHog calls
captureEvent({ distinctId, event, properties })  // Automatically adds $environment and $server_side
identifyUser({ distinctId, properties })         // Automatically adds $environment
shutdownPostHog()                                // Properly shuts down the client
```

**Automatic Properties Added:**
- `$environment`: The current environment (dev/stg/prd)
- `$server_side`: Always `true` for server-side events

### 3. Client-Side PostHog (`instrumentation-client.ts`)

The client-side PostHog initialization automatically:

- Uses `NEXT_PUBLIC_ENVIRONMENT` to determine the environment
- Sets `person_profiles` based on environment (production uses `"identified_only"`, others use `"always"`)
- Registers global properties that are added to all client-side events

**Automatic Properties Added:**
- `$environment`: The current environment (dev/stg/prd)
- `$client_side`: Always `true` for client-side events

## Person Profile Strategies

### Production (`prd`)
- **Mode**: `identified_only`
- **Behavior**: Only creates person profiles for identified users (after `posthog.identify()` is called)
- **Reason**: Reduces noise and focuses on actual users, not anonymous sessions

### Development & Staging (`dev`, `stg`)
- **Mode**: `always`
- **Behavior**: Creates person profiles for all users, including anonymous ones
- **Reason**: Allows full tracking and debugging during development

## Usage Examples

### Server-Side Event Tracking

```typescript
import { captureEvent, identifyUser, shutdownPostHog } from "@/lib/posthog-server";

// Capture an event
captureEvent({
  distinctId: "user@example.com",
  event: "checkout_completed",
  properties: {
    amount: 19.99,
    currency: "GBP",
  },
});

// Identify a user
identifyUser({
  distinctId: "user@example.com",
  properties: {
    email: "user@example.com",
    name: "John Doe",
  },
});

// Always shutdown after capturing events
await shutdownPostHog();
```

### Client-Side Event Tracking

```typescript
import posthog from "posthog-js";

// Events automatically include $environment and $client_side
posthog.capture("button_clicked", {
  button_name: "signup",
  page: "/pricing",
});

// Identify user
posthog.identify("user@example.com", {
  email: "user@example.com",
  name: "John Doe",
});
```

## Filtering Events in PostHog

### By Environment

Use the `$environment` property to filter events:

```
$environment = "prd"    # Production only
$environment = "dev"    # Development only
$environment = "stg"    # Staging only
```

### By Source

Use the automatic source properties:

```
$server_side = true     # Server-side events only
$client_side = true     # Client-side events only
```

### Combined Filters

Example: Production client-side events only:

```
$environment = "prd" AND $client_side = true
```

## Deployment Checklist

### Development
- ✅ `DOPPLER_ENVIRONMENT=dev`
- ✅ `NEXT_PUBLIC_ENVIRONMENT=dev`

### Staging
- ⚠️ `DOPPLER_ENVIRONMENT=stg`
- ⚠️ `NEXT_PUBLIC_ENVIRONMENT=stg`

### Production
- 🚨 `DOPPLER_ENVIRONMENT=prd`
- 🚨 `NEXT_PUBLIC_ENVIRONMENT=prd`

## Migration Notes

All existing PostHog tracking code has been updated to use the new wrapper functions:

- ✅ `/app/api/webhooks/stripe/route.ts` - Stripe webhook events
- ✅ `/app/api/early-access/free-queue/route.ts` - Waitlist signups
- ✅ Client-side tracking in components (automatic via `instrumentation-client.ts`)

## Troubleshooting

### Events not showing environment tag

1. Check that environment variables are set correctly
2. Verify `env.ts` is importing and validating the variables
3. For client-side: Ensure `NEXT_PUBLIC_ENVIRONMENT` is set (must start with `NEXT_PUBLIC_`)
4. Restart your development server after changing environment variables

### Production events showing in development

1. Verify `NEXT_PUBLIC_ENVIRONMENT=prd` is ONLY set in production
2. Check that `.env.local` has `NEXT_PUBLIC_ENVIRONMENT=dev`
3. Ensure staging environment has `NEXT_PUBLIC_ENVIRONMENT=stg`

### Person profiles not being created

- In production (`prd`), person profiles are only created after `identify()` is called
- In dev/staging, person profiles are created for all users automatically
- This is intentional to reduce noise in production analytics

## Best Practices

1. **Always use wrapper functions** on the server-side (`captureEvent`, `identifyUser`)
2. **Never hardcode environment values** - always use environment variables
3. **Test in staging** before deploying to production
4. **Create environment-specific dashboards** in PostHog for easier analysis
5. **Use consistent event naming** across all environments
6. **Document custom properties** for your team's events

## Additional Resources

- [PostHog Environment Variables](https://posthog.com/docs/libraries/node#environment-variables)
- [Person Profiles](https://posthog.com/docs/data/persons)
- [Event Properties](https://posthog.com/docs/data/events#event-properties)
