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
 * Build the app signup URL with query parameters
 */
export function buildAppSignupUrl(params: AppSignupParams = {}): string {
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_APP_URL || 'http://localhost:3001';
  const url = new URL('/signup', dashboardUrl);

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
 */
export function buildAppLoginUrl(): string {
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_APP_URL || 'http://localhost:3001';
  return `${dashboardUrl}/login`;
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
