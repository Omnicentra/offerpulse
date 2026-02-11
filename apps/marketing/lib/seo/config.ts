/**
 * SEO configuration - single source of truth for all URLs and metadata
 * IMPORTANT: Update CANONICAL_HOST when deploying to production
 */

// Canonical host (choose ONE and stick with it)
// Based on layout.tsx metadataBase, we're using offerpulse.io
export const CANONICAL_HOST = "www.offerpulse.io";
export const CANONICAL_BASE_URL = `https://${CANONICAL_HOST}`;

// Alternative hosts that should redirect to canonical
export const REDIRECT_HOSTS = [
  "offerpulse.io",
  "offerpulse.com",
  "www.offerpulse.com",
];

// Social links (add real URLs when available)
export const SOCIAL_LINKS = {
  twitter: "https://twitter.com/offerpulse",
  linkedin: "https://linkedin.com/company/offerpulse",
  github: "https://github.com/olaxldn/offerpulse",
  // Add more as needed
};

// Organization info for schema
export const ORGANIZATION = {
  name: "OfferPulse",
  legalName: "OfferPulse Ltd",
  url: CANONICAL_BASE_URL,
  logo: `${CANONICAL_BASE_URL}/logo-mark-pulse.svg`,
  description:
    "Competitor offer monitoring and alerts for Shopify stores. Track discounts, bundles, shipping thresholds, and cart incentives automatically.",
  foundingDate: "2025",
  email: "hello@offerpulse.io",
};

// Site configuration
export const SITE_CONFIG = {
  name: "OfferPulse",
  description:
    "OfferPulse alerts you when competitors change their offers — promos, bundles, free shipping thresholds, and cart incentives — so you can react fast and protect conversion.",
  defaultTitle: "OfferPulse | Competitor Offer Monitoring for Shopify Sellers",
  titleTemplate: "%s | OfferPulse",
};
