/**
 * Change event types
 */
export enum ChangeType {
  SHIPPING_THRESHOLD = "shipping_threshold",
  PROMO_BANNER = "promo_banner",
  BUNDLE = "bundle",
  CART_INCENTIVE = "cart_incentive",
  SITEWIDE_MESSAGE = "sitewide_message",
  DISCOUNT = "discount",
}

export const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  [ChangeType.SHIPPING_THRESHOLD]: "Free Shipping Threshold",
  [ChangeType.PROMO_BANNER]: "Promo Banner",
  [ChangeType.BUNDLE]: "Bundle Offer",
  [ChangeType.CART_INCENTIVE]: "Cart Incentive",
  [ChangeType.SITEWIDE_MESSAGE]: "Sitewide Message",
  [ChangeType.DISCOUNT]: "Discount",
};

/**
 * Confidence levels
 */
export enum Confidence {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  [Confidence.LOW]: "Low",
  [Confidence.MEDIUM]: "Medium",
  [Confidence.HIGH]: "High",
};

/**
 * Recommendation strategy types
 */
export enum StrategyType {
  MATCH = "match",
  COUNTER = "counter",
  IGNORE = "ignore",
  ENHANCE = "enhance",
}

export const STRATEGY_LABELS: Record<StrategyType, string> = {
  [StrategyType.MATCH]: "Match",
  [StrategyType.COUNTER]: "Counter",
  [StrategyType.IGNORE]: "Ignore",
  [StrategyType.ENHANCE]: "Enhance",
};

/**
 * Recommendation strategies (matches DB `recommendation_strategy`)
 */
export type RecommendationStrategy = "MATCH" | "COUNTER" | "IGNORE" | "TEST";

export const RECOMMENDATION_STRATEGY_LABELS: Record<RecommendationStrategy, string> = {
  MATCH: "Match",
  COUNTER: "Counter",
  IGNORE: "Ignore",
  TEST: "Test",
};

/**
 * Workspace member roles
 */
export enum WorkspaceRole {
  OWNER = "owner",
  ADMIN = "admin",
  MEMBER = "member",
}

export const ROLE_LABELS: Record<WorkspaceRole, string> = {
  [WorkspaceRole.OWNER]: "Owner",
  [WorkspaceRole.ADMIN]: "Admin",
  [WorkspaceRole.MEMBER]: "Member",
};

/**
 * Monitor frequency options
 */
export enum MonitorFrequency {
  HOURLY = "1h",
  SIX_HOURS = "6h",
  DAILY = "24h",
}

export const FREQUENCY_LABELS: Record<MonitorFrequency, string> = {
  [MonitorFrequency.HOURLY]: "Every hour",
  [MonitorFrequency.SIX_HOURS]: "Every 6 hours",
  [MonitorFrequency.DAILY]: "Daily",
};

/**
 * Plan types
 */
export enum PlanType {
  FREE = "free",
  TRIAL = "trial",
  PRO = "pro",
}

export const PLAN_LABELS: Record<PlanType, string> = {
  [PlanType.FREE]: "Free",
  [PlanType.TRIAL]: "Trial",
  [PlanType.PRO]: "Pro",
};

/** Default OpenRouter model when workspace has no override. Balanced: gpt-4.1-mini; Fast+reasoning: grok-4.1-fast; Best quality: gemini-3.1-pro-preview */
export const DEFAULT_OPENROUTER_MODEL = "openai/gpt-4.1-mini";
/** OpenRouter model ID restricted to Growth/Agency plans (Best quality). */
export const PREMIUM_OPENROUTER_MODEL = "google/gemini-3.1-pro-preview";
