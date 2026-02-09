export interface Workspace {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
}

export interface Competitor {
  id: string;
  name: string;
  domain: string;
  baseUrl: string;
  platformGuess: "shopify" | "other";
  tags: string[];
  isActive: boolean;
  createdAt: string;
  lastSnapshotAt?: string;
}

export interface MonitorSettings {
  competitorId: string;
  frequency: "daily" | "6h" | "1h";
  track: {
    promos: boolean;
    shipping: boolean;
    bundles: boolean;
    cart: boolean;
    deliveryReturns: boolean;
  };
}

export interface ExtractedSignals {
  promoText?: string;
  discountPercent?: number;
  discountCode?: string;
  shippingThreshold?: number;
  shippingText?: string;
  bundleText?: string;
  cartIncentiveText?: string;
  deliveryText?: string;
  returnsText?: string;
  confidence: "low" | "medium" | "high";
}

export interface Snapshot {
  id: string;
  competitorId: string;
  capturedAt: string;
  extractedSignals: ExtractedSignals;
  screenshotUrl?: string;
}

export type ChangeEventType =
  | "PROMO"
  | "SHIPPING"
  | "BUNDLE"
  | "CART_INCENTIVE"
  | "DELIVERY_RETURNS";

export interface ChangeEvent {
  id: string;
  competitorId: string;
  detectedAt: string;
  type: ChangeEventType;
  confidence: "low" | "medium" | "high";
  summary: string;
  before: Partial<ExtractedSignals>;
  after: Partial<ExtractedSignals>;
  snapshotBeforeId?: string;
  snapshotAfterId?: string;
}

export type RecommendationStrategy = "MATCH" | "COUNTER" | "IGNORE" | "TEST";
export type RecommendationStatus = "open" | "done" | "snoozed";

export interface RecommendationChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Recommendation {
  id: string;
  changeEventId: string;
  competitorId: string;
  strategy: RecommendationStrategy;
  impact: number; // 1-10
  effort: number; // 1-10
  title: string;
  rationale: string;
  checklist: RecommendationChecklistItem[];
  status: RecommendationStatus;
  snoozedUntil?: string;
}

export interface AlertSettings {
  emailEnabled: boolean;
  slackEnabled: boolean;
  slackWebhookUrl?: string;
  eventTypes: ChangeEventType[];
  minConfidence: "low" | "medium" | "high";
}

export interface WeeklyPulseHighlight {
  title: string;
  detail: string;
}

export interface WeeklyPulse {
  id: string;
  weekOf: string; // ISO date
  totals: {
    changes: number;
    promos: number;
    shipping: number;
    bundles: number;
    cart: number;
  };
  highlights: WeeklyPulseHighlight[];
  topMoves: ChangeEvent[];
  recommendations: Recommendation[];
}

export interface WorkspaceSettings {
  defaultFrequency: "daily" | "6h" | "1h";
  defaultTrack: {
    promos: boolean;
    shipping: boolean;
    bundles: boolean;
    cart: boolean;
    deliveryReturns: boolean;
  };
}

export interface MockDatabase {
  workspace: Workspace;
  users: User[];
  competitors: Competitor[];
  monitorSettings: MonitorSettings[];
  snapshots: Snapshot[];
  changeEvents: ChangeEvent[];
  recommendations: Recommendation[];
  alertSettings: AlertSettings;
  weeklyPulses: WeeklyPulse[];
  workspaceSettings: WorkspaceSettings;
}
