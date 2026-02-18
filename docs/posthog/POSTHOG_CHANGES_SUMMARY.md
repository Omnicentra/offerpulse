# PostHog Environment Separation - Changes Summary

## Overview

PostHog has been configured to properly separate events across dev, staging, and production environments. All events are now automatically tagged with their environment and source (server-side vs client-side).

## Files Modified

### 1. `env.ts` ✅
**Changes:**
- Added `NEXT_PUBLIC_ENVIRONMENT` to client schema with validation for `"dev" | "stg" | "prd"`

**Impact:**
- Client-side code can now access the environment setting
- Type-safe environment validation

### 2. `lib/posthog-server.ts` ✅
**Changes:**
- Imported `env` from `@/env`
- Added environment-based `personProfilesMode` configuration
- Created `captureEvent()` wrapper function that automatically adds:
  - `$environment` property
  - `$server_side: true` property
- Created `identifyUser()` wrapper function that automatically adds:
  - `$environment` property
- Exported `shutdownPostHog()` for proper cleanup

**Impact:**
- All server-side events now include environment tags
- Consistent event tracking across the application
- Production uses `identified_only` person profiles (reduces noise)
- Dev/staging use `always` person profiles (full tracking)

### 3. `instrumentation-client.ts` ✅
**Changes:**
- Added environment detection from `NEXT_PUBLIC_ENVIRONMENT`
- Configured `person_profiles` based on environment
- Added `loaded` callback to register global properties:
  - `$environment`
  - `$client_side: true`

**Impact:**
- All client-side events automatically include environment tags
- No code changes needed in components
- Production uses `identified_only` person profiles
- Dev/staging use `always` person profiles

### 4. `app/api/webhooks/stripe/route.ts` ✅
**Changes:**
- Updated imports to use `captureEvent`, `identifyUser`, `shutdownPostHog`
- Replaced direct PostHog calls with wrapper functions in:
  - Checkout completion handler
  - Checkout error handler
  - Checkout expiration handler
  - Payment failure handler

**Impact:**
- All Stripe webhook events now include environment tags
- Cleaner, more maintainable code

### 5. `app/api/early-access/free-queue/route.ts` ✅
**Changes:**
- Updated imports to use `captureEvent`, `identifyUser`, `shutdownPostHog`
- Replaced direct PostHog calls with wrapper functions

**Impact:**
- Waitlist signup events now include environment tags

### 6. `.env.local` ✅
**Changes:**
- Added `NEXT_PUBLIC_ENVIRONMENT=dev`

**Impact:**
- Client-side code can now detect the environment
- Must be set in all deployment environments (staging, production)

## New Files Created

### 1. `POSTHOG_ENVIRONMENT_SETUP.md` 📄
Comprehensive documentation covering:
- Environment variable setup
- Configuration details
- Usage examples
- Filtering events in PostHog
- Deployment checklist
- Troubleshooting guide
- Best practices

### 2. `POSTHOG_CHANGES_SUMMARY.md` 📄
This file - quick reference of all changes made.

## Environment Variables Required

### All Environments
```bash
# Existing (already set)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com

# Server-side (already set)
DOPPLER_ENVIRONMENT=dev  # or stg, prd

# NEW - Client-side (must be added)
NEXT_PUBLIC_ENVIRONMENT=dev  # or stg, prd
```

### Development (`.env.local`)
```bash
DOPPLER_ENVIRONMENT=dev
NEXT_PUBLIC_ENVIRONMENT=dev
```

### Staging (Deployment Config)
```bash
DOPPLER_ENVIRONMENT=stg
NEXT_PUBLIC_ENVIRONMENT=stg
```

### Production (Deployment Config)
```bash
DOPPLER_ENVIRONMENT=prd
NEXT_PUBLIC_ENVIRONMENT=prd
```

## Event Properties Added

All events now automatically include:

### Server-Side Events
```javascript
{
  $environment: "dev" | "stg" | "prd",
  $server_side: true,
  // ... your custom properties
}
```

### Client-Side Events
```javascript
{
  $environment: "dev" | "stg" | "prd",
  $client_side: true,
  // ... your custom properties
}
```

## Testing Checklist

### Local Development
- [ ] Verify `NEXT_PUBLIC_ENVIRONMENT=dev` in `.env.local`
- [ ] Start dev server: `pnpm dev`
- [ ] Trigger a client-side event (e.g., click a CTA button)
- [ ] Check PostHog: event should have `$environment: "dev"` and `$client_side: true`
- [ ] Trigger a server-side event (e.g., join waitlist)
- [ ] Check PostHog: event should have `$environment: "dev"` and `$server_side: true`

### Staging
- [ ] Set `NEXT_PUBLIC_ENVIRONMENT=stg` in deployment config
- [ ] Set `DOPPLER_ENVIRONMENT=stg` in deployment config
- [ ] Deploy to staging
- [ ] Verify events show `$environment: "stg"`

### Production
- [ ] Set `NEXT_PUBLIC_ENVIRONMENT=prd` in deployment config
- [ ] Set `DOPPLER_ENVIRONMENT=prd` in deployment config
- [ ] Deploy to production
- [ ] Verify events show `$environment: "prd"`

## PostHog Dashboard Filters

Create these filters to separate your data:

### Production Only
```
$environment = "prd"
```

### Development Only
```
$environment = "dev"
```

### Staging Only
```
$environment = "stg"
```

### Production Client-Side Only
```
$environment = "prd" AND $client_side = true
```

### Production Server-Side Only
```
$environment = "prd" AND $server_side = true
```

## Migration Impact

### ✅ No Breaking Changes
- Existing events continue to work
- New properties are additive
- No changes needed in component code (client-side)

### ⚠️ Action Required
1. Add `NEXT_PUBLIC_ENVIRONMENT` to all deployment environments
2. Update staging environment variables
3. Update production environment variables
4. Create environment-specific dashboards in PostHog (optional but recommended)

## Benefits

1. **Data Separation**: Dev/staging data won't pollute production analytics
2. **Better Debugging**: Easily filter events by environment
3. **Accurate Metrics**: Production metrics are clean and reliable
4. **Cost Optimization**: Production uses `identified_only` person profiles
5. **Compliance**: Easier to separate test data from real user data
6. **Team Collaboration**: Developers can test without affecting production dashboards

## Next Steps

1. ✅ Code changes complete
2. ⏳ Add `NEXT_PUBLIC_ENVIRONMENT` to staging deployment config
3. ⏳ Add `NEXT_PUBLIC_ENVIRONMENT` to production deployment config
4. ⏳ Test in staging environment
5. ⏳ Deploy to production
6. ⏳ Create environment-specific dashboards in PostHog
7. ⏳ Update team documentation with new filtering capabilities

## Questions?

Refer to `POSTHOG_ENVIRONMENT_SETUP.md` for detailed documentation, troubleshooting, and best practices.
