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
 * Get PostHog device ID for cross-domain tracking
 * Returns null if PostHog is not initialized or in server environment
 */
function getPostHogDeviceId(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // Dynamic import to avoid issues when posthog is not available
    const posthog = (window as any).posthog;
    if (posthog && typeof posthog.get_distinct_id === 'function') {
      return posthog.get_distinct_id();
    }
  } catch (error) {
    console.warn('PostHog not initialized for cross-domain tracking:', error);
  }
  
  return null;
}

/**
 * Build the app signup URL with query parameters
 * Includes PostHog device ID for cross-domain tracking
 */
export function buildAppSignupUrl(params: AppSignupParams = {}): string {
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_APP_URL || 'http://localhost:3001';
  const url = new URL('/signup', dashboardUrl);

  // Add PostHog device ID for cross-domain tracking
  const deviceId = getPostHogDeviceId();
  if (deviceId) {
    url.searchParams.set('ph_device_id', deviceId);
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
 * Includes PostHog device ID for cross-domain tracking
 */
export function buildAppLoginUrl(): string {
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_APP_URL || 'http://localhost:3001';
  const url = new URL('/login', dashboardUrl);
  
  // Add PostHog device ID for cross-domain tracking
  const deviceId = getPostHogDeviceId();
  if (deviceId) {
    url.searchParams.set('ph_device_id', deviceId);
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
  ONBOARDING_INTENT: 'offerpulse_onboarding_intent',
  SHOPIFY_CONNECTED: 'offerpulse_shopify_connected',
  SHOPIFY_STORE_DOMAIN: 'offerpulse_shopify_store_domain',
} as const;

/**
 * Onboarding intent structure
 */
export interface OnboardingIntent {
  competitorUrl?: string;
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  createdAt: string;
}

/**
 * Store onboarding intent in localStorage
 */
export function storeOnboardingIntent(intent: Omit<OnboardingIntent, 'createdAt'>): void {
  if (typeof window === 'undefined') return;
  
  const fullIntent: OnboardingIntent = {
    ...intent,
    createdAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_INTENT, JSON.stringify(fullIntent));
  } catch (error) {
    console.error('Failed to store onboarding intent:', error);
  }
}

/**
 * Retrieve onboarding intent from localStorage
 */
export function getOnboardingIntent(): OnboardingIntent | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ONBOARDING_INTENT);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to retrieve onboarding intent:', error);
    return null;
  }
}

/**
 * Clear onboarding intent from localStorage
 */
export function clearOnboardingIntent(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEYS.ONBOARDING_INTENT);
  } catch (error) {
    console.error('Failed to clear onboarding intent:', error);
  }
}

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
