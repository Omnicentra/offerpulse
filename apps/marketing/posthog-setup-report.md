# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into your Next.js marketing application. This integration includes:

- **Client-side tracking** via `instrumentation-client.ts` (Next.js 15.3+ recommended approach)
- **Server-side tracking** via `posthog-node` for Stripe webhooks and API routes
- **Reverse proxy** configured in `next.config.mjs` for reliable event delivery
- **User identification** on signup and signin for cross-session tracking
- **Exception capture** enabled for automatic error tracking

## Events Implemented

| Event Name | Description | File |
|------------|-------------|------|
| `checkout_initiated` | User clicks to start Stripe checkout | `app/(marketing)/snapshot/page.tsx` |
| `checkout_completed` | Stripe checkout completed with payment (server-side) | `app/api/webhooks/stripe/route.ts` |
| `checkout_expired` | Stripe checkout session expired (server-side) | `app/api/webhooks/stripe/route.ts` |
| `payment_failed` | Stripe payment failed (server-side) | `app/api/webhooks/stripe/route.ts` |
| `waitlist_joined` | User joins the free waitlist queue (server-side) | `app/api/early-access/free-queue/route.ts` |
| `signup_form_submitted` | User submits the signup form | `app/auth/sign-up/page.tsx` |
| `signup_completed` | Account creation successful with identify | `app/auth/sign-up/page.tsx` |
| `signin_form_submitted` | User submits the signin form | `app/auth/sign-in/page.tsx` |
| `signin_completed` | User successfully signed in with identify | `app/auth/sign-in/page.tsx` |
| `offer_tool_analyzed` | User analyzes a URL with the free tool | `app/(marketing)/free-tools/[slug]/tool/page.tsx` |
| `offer_tool_error` | Error during free tool analysis | `app/(marketing)/free-tools/[slug]/tool/page.tsx` |
| `pricing_plan_selected` | User selects a pricing plan | `components/pricing-cards.tsx` |
| `cta_clicked` | User clicks main CTA button | `components/cta-section.tsx` |

## Files Created

| File | Purpose |
|------|---------|
| `instrumentation-client.ts` | Client-side PostHog initialization |
| `lib/posthog-server.ts` | Server-side PostHog client helper |
| `posthog-setup-report.md` | This report |

## Files Modified

| File | Changes |
|------|---------|
| `next.config.mjs` | Added reverse proxy rewrites and `skipTrailingSlashRedirect` |
| `.env.local` | Added `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` |
| `app/api/webhooks/stripe/route.ts` | Added checkout/payment tracking |
| `app/api/early-access/free-queue/route.ts` | Added waitlist tracking |
| `app/(marketing)/snapshot/page.tsx` | Added checkout initiation tracking |
| `app/auth/sign-up/page.tsx` | Added signup tracking with identify |
| `app/auth/sign-in/page.tsx` | Added signin tracking with identify |
| `app/(marketing)/free-tools/[slug]/tool/page.tsx` | Added tool usage tracking |
| `components/pricing-cards.tsx` | Added pricing plan selection tracking |
| `components/cta-section.tsx` | Added CTA click tracking |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- [Analytics basics](https://eu.posthog.com/project/127268/dashboard/525618) - Core analytics dashboard

### Insights
- [Checkout Conversion Funnel](https://eu.posthog.com/project/127268/insights/6Jaxxl1F) - Tracks checkout initiation to completion
- [Signup Conversion Funnel](https://eu.posthog.com/project/127268/insights/iJOdhzOJ) - Tracks signup form to completion
- [Lead Acquisition Trend](https://eu.posthog.com/project/127268/insights/EMhvRVTM) - Daily waitlist and purchase trends
- [Free Tool Usage](https://eu.posthog.com/project/127268/insights/PinjJQgA) - Tool analyses and errors
- [Checkout Drop-offs](https://eu.posthog.com/project/127268/insights/R3qlThV8) - Expired checkouts and payment failures

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/posthog-integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
