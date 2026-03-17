# OfferPulse Marketing Website

A production-ready marketing website for OfferPulse — competitive offer monitoring for Shopify sellers.

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm (comes with Node.js)

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Production Build

```bash
# Create optimised production build
npm run build

# Start production server
npm start
```

## Project Structure

```
├── app/
│   ├── (marketing)/          # Marketing pages with shared layout
│   │   ├── page.tsx          # Homepage with Offer Snapshot flow
│   │   ├── pricing/          # Pricing page
│   │   ├── how-it-works/     # How it works page
│   │   ├── faq/              # FAQ page
│   │   ├── blog/             # Blog index
│   │   ├── privacy/          # Privacy policy
│   │   └── terms/            # Terms of service
│   ├── auth/
│   │   ├── sign-up/          # Sign up page
│   │   └── sign-in/          # Sign in page
│   ├── api/
│   │   └── offer-snapshot/   # Mock API endpoint
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles + CSS variables
│   ├── robots.ts             # SEO robots.txt
│   └── sitemap.ts            # SEO sitemap
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── navbar.tsx            # Site navigation
│   ├── footer.tsx            # Site footer
│   ├── section-heading.tsx   # Reusable section headers
│   ├── pricing-cards.tsx     # Pricing tier cards
│   ├── feature-grid.tsx      # Feature showcase grid
│   ├── how-it-works-steps.tsx # Steps visualisation
│   ├── faq-accordion.tsx     # FAQ accordion
│   ├── cta-section.tsx       # Call-to-action sections
│   ├── offer-snapshot-form.tsx    # URL input form
│   ├── offer-snapshot-skeleton.tsx # Loading skeleton
│   └── full-report-locked.tsx     # Gated content overlay
├── lib/
│   ├── analytics.ts          # Analytics tracking utility
│   ├── validators.ts         # Zod validation schemas
│   └── utils.ts              # Helper functions
├── hooks/
│   └── use-toast.ts          # Toast notifications hook
└── public/
    ├── favicon.svg           # Site favicon (add favicon.ico for legacy)
    ├── og.png                # OG image placeholder (replace with 1200×630)
    └── site.webmanifest      # PWA manifest
```

## Customisation

### Changing Copy

Most marketing copy is located in the page components:

- **Homepage**: `app/(marketing)/page.tsx`
- **Pricing**: `app/(marketing)/pricing/page.tsx` and `components/pricing-cards.tsx`
- **How it Works**: `app/(marketing)/how-it-works/page.tsx`
- **FAQ**: `components/faq-accordion.tsx`

### Branding

- **Colours**: Edit CSS variables in `app/globals.css`
- **Logo**: Update the icon in `components/navbar.tsx` and `components/footer.tsx`
- **Fonts**: Change the font import in `app/layout.tsx`

### Pricing

Update pricing tiers in `components/pricing-cards.tsx`:

```typescript
const plans = [
  {
    name: "Starter",
    price: "£19",
    // ...
  },
  // ...
]
```

## Offer Snapshot Tool

The Offer Snapshot tool is implemented at `app/api/tools/offer-snapshot/route.ts`. To integrate additional scraping:

### 1. Set Up Scraping Infrastructure

```typescript
// Future implementation in route.ts

// 1. FETCH HTML/HEADLESS BROWSER
// Use Puppeteer or Playwright for JavaScript-rendered content
const browser = await puppeteer.launch()
const page = await browser.newPage()
await page.goto(url, { waitUntil: 'networkidle2' })
const html = await page.content()

// 2. SIGNAL DETECTION
// Parse HTML with cheerio
// Use regex patterns for common offer formats
// Check common Shopify theme locations

// 3. NOISE FILTERING
// Filter navigation, footer, boilerplate
// Validate currency formats (£, €, $)
// Score confidence levels

// 4. SNAPSHOT STORAGE
// Store raw HTML for diff comparison
// Generate screenshots
// Create structured records in database
```

### 2. Add Required Dependencies

```bash
npm install puppeteer cheerio
```

### 3. Set Up Database

For production, you'll need:
- PostgreSQL or similar for structured data
- Object storage (S3) for HTML snapshots and screenshots
- Redis for caching and rate limiting

### 4. Add Environment Variables

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
AWS_S3_BUCKET=offerpulse-snapshots
```

## Analytics Events

The site tracks these events (see `lib/analytics.ts`):

- `offer_snapshot_submitted` - User submitted a URL
- `offer_snapshot_success` - Snapshot generated successfully
- `offer_snapshot_error` - Snapshot generation failed
- `cta_signup_clicked` - User clicked signup CTA
- `pricing_viewed` - User viewed pricing page

To integrate with your analytics provider, update `lib/analytics.ts`:

```typescript
export function track(event: AnalyticsEvent, properties?: EventProperties): void {
  // Example with Segment
  if (typeof window !== 'undefined' && window.analytics) {
    window.analytics.track(event, properties)
  }
}
```

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Forms**: react-hook-form + zod
- **Font**: Inter (via next/font)

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Create production build
npm start        # Start production server
npm run lint     # Run ESLint
```

## Browser Support

Supports all modern browsers (Chrome, Firefox, Safari, Edge).

## Licence

Proprietary - All rights reserved.
