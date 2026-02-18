# Airtable & Resend Email Setup

This document explains the Airtable and Resend email integration for the OfferPulse marketing app.

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Resend API Key (get from https://resend.com/api-keys)
RESEND_API_KEY=re_...

# Airtable Personal Access Token (get from https://airtable.com/create/tokens)
AIRTABLE_API_KEY=pat...

# Airtable Base ID (already set by default)
AIRTABLE_BASE_ID=app2FMikxa9F6erFY
```

## Resend Setup

1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Create a new API key
3. Add the key to your `.env.local` as `RESEND_API_KEY`
4. **Important:** You need to verify your domain in Resend to send emails from `hello@offerpulse.com`
   - Go to [Resend Domains](https://resend.com/domains)
   - Add your domain (`offerpulse.com`)
   - Add the DNS records (MX, TXT, CNAME) to your domain provider
   - Wait for verification (usually a few minutes)

## Airtable Setup

1. Go to [Airtable Create Token](https://airtable.com/create/tokens)
2. Create a new Personal Access Token with:
   - **Scope:** `data.records:read` and `data.records:write`
   - **Base Access:** Select your "OfferPulse" base
3. Copy the token and add it to `.env.local` as `AIRTABLE_API_KEY`

## What Gets Saved Where

### Paid Customers (Promo Report Purchases Table)

When a user completes payment via Stripe:
- **Contact Email** - Customer's email
- **Contact Name** - Customer's name (if provided by Stripe)
- **Competitor URL** - URL they want analyzed (from metadata)
- **Purchase Date** - Date of purchase
- **Source Form** - "Snapshot Page - Stripe Checkout"
- **Promo Report Type** - "£19 Competitor Promo Report"
- UTM tracking (stored in metadata, not visible in Airtable yet)

### Waitlist Signups (Waitlist Table)

When a user joins the free waitlist:
- **Email** - User's email
- **Signup Date** - Date they signed up
- **Status** - "Waiting"
- **Notes** - Contains:
  - Competitor URL (if provided)
  - UTM parameters (source, medium, campaign)

## Email Template

The purchase confirmation email includes:
- ✅ Confirmation header with green success styling
- What happens next (4 key points)
- What they'll get (detailed benefits)
- Footer with links and order ID

Template location: `apps/marketing/emails/PurchaseConfirmation.tsx`

## Testing

### Test Stripe Webhook Locally

1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
2. Login: `stripe login`
3. Forward webhooks to local: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
4. Trigger test event: `stripe trigger checkout.session.completed`
5. Check console logs for Airtable save and email send

### Test Waitlist Signup

1. Go to `/snapshot` page
2. Fill in email and click "Join waitlist"
3. Check Airtable Waitlist table for new record

## API Routes Modified

1. **`/api/webhooks/stripe`** - Now saves to Airtable and sends confirmation email on successful payment
2. **`/api/early-access/free-queue`** - Now saves waitlist signups to Airtable

## Dependencies Added

```json
{
  "resend": "^6.9.2",
  "@react-email/components": "^1.0.7",
  "react-email": "^5.2.8"
}
```

## Production Checklist

- [ ] Add `RESEND_API_KEY` to Vercel environment variables
- [ ] Add `AIRTABLE_API_KEY` to Vercel environment variables
- [ ] Verify your domain in Resend
- [ ] Test email sending in production
- [ ] Test Airtable saves in production
- [ ] Update Stripe webhook endpoint in Stripe Dashboard to production URL
- [ ] Verify webhook signature with production `STRIPE_WEBHOOK_SECRET`
