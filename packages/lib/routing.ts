/**
 * Shared routing utilities for cross-app navigation
 * Used by both marketing and dashboard apps
 */

interface AppSignupParams {
  competitorUrl?: string;
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

/**
 * Get PostHog IDs for cross-domain tracking (bootstrap approach)
 * Returns both distinct_id and session_id for full session continuity
 */
function getPostHogIds(): { distinctId: string | null; sessionId: string | null } {
  if (typeof window === 'undefined') return { distinctId: null, sessionId: null };
  
  try {
    const posthog = (window as any).posthog;
    if (posthog) {
      const distinctId = typeof posthog.get_distinct_id === 'function' ? posthog.get_distinct_id() : null;
      const sessionId = typeof posthog.get_session_id === 'function' ? posthog.get_session_id() : null;
      return { distinctId, sessionId };
    }
  } catch (error) {
    console.warn('PostHog not initialized for cross-domain tracking:', error);
  }
  
  return { distinctId: null, sessionId: null };
}

/**
 * Build the app signup URL with query parameters
 * Includes PostHog distinct_id and session_id for cross-domain tracking (bootstrap approach)
 */
export function buildAppSignupUrl(params: AppSignupParams = {}): string {
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_APP_URL || 'http://localhost:3001';
  const url = new URL('/signup', dashboardUrl);

  // Add PostHog IDs for cross-domain tracking (bootstrap approach)
  const { distinctId, sessionId } = getPostHogIds();
  if (distinctId) {
    url.searchParams.set('ph_distinct_id', distinctId);
  }
  if (sessionId) {
    url.searchParams.set('ph_session_id', sessionId);
  }

  if (params.competitorUrl) {
    url.searchParams.set('competitorUrl', params.competitorUrl);
  }

  if (params.source) {
    url.searchParams.set('source', params.source);
  }

  if (params.utm_source) {
    url.searchParams.set('utm_source', params.utm_source);
  }

  if (params.utm_medium) {
    url.searchParams.set('utm_medium', params.utm_medium);
  }

  if (params.utm_campaign) {
    url.searchParams.set('utm_campaign', params.utm_campaign);
  }

  return url.toString();
}

/**
 * Build the app login URL
 * Includes PostHog distinct_id and session_id for cross-domain tracking (bootstrap approach)
 */
export function buildAppLoginUrl(): string {
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_APP_URL || 'http://localhost:3001';
  const url = new URL('/login', dashboardUrl);
  
  // Add PostHog IDs for cross-domain tracking (bootstrap approach)
  const { distinctId, sessionId } = getPostHogIds();
  if (distinctId) {
    url.searchParams.set('ph_distinct_id', distinctId);
  }
  if (sessionId) {
    url.searchParams.set('ph_session_id', sessionId);
  }
  
  return url.toString();
}

/**
 * Get the marketing app URL
 */
export function getMarketingUrl(): string {
  return process.env.NEXT_PUBLIC_MARKETING_APP_URL || 'http://localhost:3000';
}

/**
 * Get the dashboard app URL
 */
export function getDashboardUrl(): string {
  return process.env.NEXT_PUBLIC_DASHBOARD_APP_URL || 'http://localhost:3001';
}

/**
 * Storage keys for cross-app state
 */
export const STORAGE_KEYS = {
  COMPETITOR_URL: 'offerpulse_competitor_url',
  SHOPIFY_CONNECTED: 'offerpulse_shopify_connected',
  SHOPIFY_STORE_DOMAIN: 'offerpulse_shopify_store_domain',
} as const;

/**
 * Validate URL format
 */
export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Store competitor URL in session storage (marketing fallback)
 */
export function storeCompetitorUrl(url: string): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(STORAGE_KEYS.COMPETITOR_URL, url);
  } catch (error) {
    console.error('Failed to store competitor URL:', error);
  }
}

/**
 * Get competitor URL from session storage
 */
export function getStoredCompetitorUrl(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return sessionStorage.getItem(STORAGE_KEYS.COMPETITOR_URL);
  } catch (error) {
    console.error('Failed to retrieve competitor URL:', error);
    return null;
  }
}
