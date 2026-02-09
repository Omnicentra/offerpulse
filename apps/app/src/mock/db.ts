import type { MockDatabase } from "./types";

const STORAGE_KEY = "offerpulse_mock_db";

// Seed data generator
export function generateSeedData(): MockDatabase {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const competitors = [
    {
      id: "comp-1",
      name: "Fashion Forward",
      domain: "fashionforward.com",
      baseUrl: "https://fashionforward.com",
      platformGuess: "shopify" as const,
      tags: ["fashion", "apparel", "premium"],
      isActive: true,
      createdAt: fourteenDaysAgo.toISOString(),
      lastSnapshotAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "comp-2",
      name: "TechGear Pro",
      domain: "techgearpro.com",
      baseUrl: "https://techgearpro.com",
      platformGuess: "other" as const,
      tags: ["electronics", "tech", "gadgets"],
      isActive: true,
      createdAt: fourteenDaysAgo.toISOString(),
      lastSnapshotAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "comp-3",
      name: "Home Essentials",
      domain: "homeessentials.co",
      baseUrl: "https://homeessentials.co",
      platformGuess: "shopify" as const,
      tags: ["home", "lifestyle"],
      isActive: true,
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      lastSnapshotAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "comp-4",
      name: "Beauty Bliss",
      domain: "beautybliss.com",
      baseUrl: "https://beautybliss.com",
      platformGuess: "shopify" as const,
      tags: ["beauty", "cosmetics", "skincare"],
      isActive: true,
      createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      lastSnapshotAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "comp-5",
      name: "Outdoor Adventures",
      domain: "outdooradventures.com",
      baseUrl: "https://outdooradventures.com",
      platformGuess: "other" as const,
      tags: ["outdoor", "sports", "camping"],
      isActive: false,
      createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      lastSnapshotAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const monitorSettings = competitors.map((comp) => ({
    competitorId: comp.id,
    frequency: comp.id === "comp-1" ? ("6h" as const) : ("daily" as const),
    track: {
      promos: true,
      shipping: true,
      bundles: true,
      cart: true,
      deliveryReturns: true,
    },
  }));

  const snapshots = [
    {
      id: "snap-1",
      competitorId: "comp-1",
      capturedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      extractedSignals: {
        promoText: "20% OFF SITEWIDE",
        discountPercent: 20,
        discountCode: "SAVE20",
        shippingThreshold: 50,
        shippingText: "Free shipping on orders over $50",
        confidence: "high" as const,
      },
    },
    {
      id: "snap-2",
      competitorId: "comp-1",
      capturedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
      extractedSignals: {
        promoText: "15% OFF WINTER COLLECTION",
        discountPercent: 15,
        discountCode: "WINTER15",
        shippingThreshold: 75,
        shippingText: "Free shipping on orders over $75",
        confidence: "high" as const,
      },
    },
    {
      id: "snap-3",
      competitorId: "comp-2",
      capturedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      extractedSignals: {
        bundleText: "Buy 2 Get 1 Free on all accessories",
        cartIncentiveText: "Add $25 more to unlock free gift",
        confidence: "medium" as const,
      },
    },
    {
      id: "snap-4",
      competitorId: "comp-2",
      capturedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      extractedSignals: {
        bundleText: "Buy 3 Get 1 Free on accessories",
        confidence: "medium" as const,
      },
    },
    {
      id: "snap-5",
      competitorId: "comp-3",
      capturedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      extractedSignals: {
        promoText: "Flash Sale: 30% Off Home Decor",
        discountPercent: 30,
        deliveryText: "Same-day delivery available in select cities",
        returnsText: "Extended 60-day returns",
        confidence: "high" as const,
      },
    },
    {
      id: "snap-6",
      competitorId: "comp-3",
      capturedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      extractedSignals: {
        promoText: "25% Off Home Decor",
        discountPercent: 25,
        deliveryText: "Standard delivery 3-5 days",
        returnsText: "30-day returns",
        confidence: "high" as const,
      },
    },
    {
      id: "snap-7",
      competitorId: "comp-4",
      capturedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      extractedSignals: {
        shippingText: "Free 2-day shipping on all orders",
        cartIncentiveText: "Free deluxe sample with orders over $35",
        confidence: "high" as const,
      },
    },
    {
      id: "snap-8",
      competitorId: "comp-4",
      capturedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      extractedSignals: {
        shippingText: "Free standard shipping on orders over $25",
        confidence: "medium" as const,
      },
    },
    {
      id: "snap-9",
      competitorId: "comp-5",
      capturedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      extractedSignals: {
        promoText: "Gear Up Sale: 40% Off Select Items",
        discountPercent: 40,
        confidence: "medium" as const,
      },
    },
    {
      id: "snap-10",
      competitorId: "comp-1",
      capturedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      extractedSignals: {
        promoText: "10% OFF for new customers",
        discountPercent: 10,
        discountCode: "NEW10",
        confidence: "high" as const,
      },
    },
    {
      id: "snap-11",
      competitorId: "comp-2",
      capturedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      extractedSignals: {
        confidence: "low" as const,
      },
    },
    {
      id: "snap-12",
      competitorId: "comp-3",
      capturedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      extractedSignals: {
        promoText: "Grand Opening: 20% Off Everything",
        discountPercent: 20,
        confidence: "high" as const,
      },
    },
  ];

  const changeEvents = [
    {
      id: "change-1",
      competitorId: "comp-1",
      detectedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      type: "PROMO" as const,
      confidence: "high" as const,
      summary: "Increased discount from 15% to 20%",
      before: { discountPercent: 15, discountCode: "WINTER15" },
      after: { discountPercent: 20, discountCode: "SAVE20" },
      snapshotBeforeId: "snap-2",
      snapshotAfterId: "snap-1",
    },
    {
      id: "change-2",
      competitorId: "comp-1",
      detectedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
      type: "SHIPPING" as const,
      confidence: "high" as const,
      summary: "Reduced free shipping threshold from $75 to $50",
      before: { shippingThreshold: 75 },
      after: { shippingThreshold: 50 },
      snapshotBeforeId: "snap-2",
      snapshotAfterId: "snap-1",
    },
    {
      id: "change-3",
      competitorId: "comp-2",
      detectedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      type: "BUNDLE" as const,
      confidence: "medium" as const,
      summary: "Changed bundle offer from Buy 3 Get 1 to Buy 2 Get 1",
      before: { bundleText: "Buy 3 Get 1 Free on accessories" },
      after: { bundleText: "Buy 2 Get 1 Free on all accessories" },
      snapshotBeforeId: "snap-4",
      snapshotAfterId: "snap-3",
    },
    {
      id: "change-4",
      competitorId: "comp-3",
      detectedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      type: "PROMO" as const,
      confidence: "high" as const,
      summary: "Flash sale increased from 25% to 30%",
      before: { discountPercent: 25 },
      after: { discountPercent: 30 },
      snapshotBeforeId: "snap-6",
      snapshotAfterId: "snap-5",
    },
    {
      id: "change-5",
      competitorId: "comp-3",
      detectedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      type: "DELIVERY_RETURNS" as const,
      confidence: "high" as const,
      summary: "Added same-day delivery and extended returns to 60 days",
      before: {
        deliveryText: "Standard delivery 3-5 days",
        returnsText: "30-day returns",
      },
      after: {
        deliveryText: "Same-day delivery available in select cities",
        returnsText: "Extended 60-day returns",
      },
      snapshotBeforeId: "snap-6",
      snapshotAfterId: "snap-5",
    },
    {
      id: "change-6",
      competitorId: "comp-4",
      detectedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      type: "SHIPPING" as const,
      confidence: "high" as const,
      summary: "Upgraded to free 2-day shipping on all orders",
      before: { shippingText: "Free standard shipping on orders over $25" },
      after: { shippingText: "Free 2-day shipping on all orders" },
      snapshotBeforeId: "snap-8",
      snapshotAfterId: "snap-7",
    },
    {
      id: "change-7",
      competitorId: "comp-4",
      detectedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      type: "CART_INCENTIVE" as const,
      confidence: "high" as const,
      summary: "Added free deluxe sample incentive for orders over $35",
      before: {},
      after: { cartIncentiveText: "Free deluxe sample with orders over $35" },
      snapshotBeforeId: "snap-8",
      snapshotAfterId: "snap-7",
    },
    {
      id: "change-8",
      competitorId: "comp-2",
      detectedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      type: "CART_INCENTIVE" as const,
      confidence: "medium" as const,
      summary: "Added cart threshold incentive",
      before: {},
      after: { cartIncentiveText: "Add $25 more to unlock free gift" },
      snapshotBeforeId: "snap-4",
      snapshotAfterId: "snap-3",
    },
    {
      id: "change-9",
      competitorId: "comp-1",
      detectedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      type: "PROMO" as const,
      confidence: "medium" as const,
      summary: "Started new customer discount campaign",
      before: {},
      after: { discountPercent: 10, discountCode: "NEW10" },
      snapshotAfterId: "snap-10",
    },
    {
      id: "change-10",
      competitorId: "comp-5",
      detectedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      type: "PROMO" as const,
      confidence: "medium" as const,
      summary: "Launched gear sale with 40% discount",
      before: {},
      after: { discountPercent: 40 },
      snapshotAfterId: "snap-9",
    },
    {
      id: "change-11",
      competitorId: "comp-3",
      detectedAt: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000).toISOString(),
      type: "PROMO" as const,
      confidence: "high" as const,
      summary: "Grand opening promotion",
      before: {},
      after: { discountPercent: 20 },
      snapshotAfterId: "snap-12",
    },
    {
      id: "change-12",
      competitorId: "comp-1",
      detectedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      type: "SHIPPING" as const,
      confidence: "low" as const,
      summary: "Possible shipping policy update detected",
      before: {},
      after: { shippingText: "Updated shipping terms" },
    },
    {
      id: "change-13",
      competitorId: "comp-2",
      detectedAt: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString(),
      type: "BUNDLE" as const,
      confidence: "medium" as const,
      summary: "Introduced accessory bundle deal",
      before: {},
      after: { bundleText: "Bundle and save on accessories" },
    },
  ];

  const recommendations = [
    {
      id: "rec-1",
      changeEventId: "change-1",
      competitorId: "comp-1",
      strategy: "MATCH" as const,
      impact: 8,
      effort: 3,
      title: "Match competitor's 20% discount",
      rationale:
        "Fashion Forward increased their discount to 20%. Matching this could help retain price-sensitive customers during this promotional period.",
      checklist: [
        { id: "c1", text: "Review current margin impact", done: false },
        { id: "c2", text: "Set up discount code in platform", done: false },
        { id: "c3", text: "Update homepage banner", done: false },
        { id: "c4", text: "Send email to subscriber list", done: false },
      ],
      status: "open" as const,
    },
    {
      id: "rec-2",
      changeEventId: "change-2",
      competitorId: "comp-1",
      strategy: "COUNTER" as const,
      impact: 7,
      effort: 2,
      title: "Counter with free shipping on all orders",
      rationale:
        "Instead of matching their $50 threshold, differentiate by offering free shipping on all orders. This is simpler and more compelling.",
      checklist: [
        { id: "c1", text: "Calculate cost impact", done: true },
        { id: "c2", text: "Update shipping settings", done: false },
        { id: "c3", text: "Update product pages", done: false },
      ],
      status: "open" as const,
    },
    {
      id: "rec-3",
      changeEventId: "change-3",
      competitorId: "comp-2",
      strategy: "IGNORE" as const,
      impact: 4,
      effort: 5,
      title: "Monitor bundle offer performance",
      rationale:
        "Bundle offers may not align with our current inventory strategy. Monitor competitor performance before deciding to match.",
      checklist: [
        { id: "c1", text: "Track TechGear's bundle engagement", done: false },
        { id: "c2", text: "Review our accessory inventory", done: false },
      ],
      status: "open" as const,
    },
    {
      id: "rec-4",
      changeEventId: "change-4",
      competitorId: "comp-3",
      strategy: "TEST" as const,
      impact: 9,
      effort: 4,
      title: "Test flash sale strategy",
      rationale:
        "Home Essentials saw success with flash sales. Consider testing a limited-time 25% off campaign on a product category.",
      checklist: [
        { id: "c1", text: "Select product category for test", done: false },
        { id: "c2", text: "Set up 48-hour flash sale", done: false },
        { id: "c3", text: "Prepare marketing assets", done: false },
        { id: "c4", text: "Set up tracking and analytics", done: false },
      ],
      status: "open" as const,
    },
    {
      id: "rec-5",
      changeEventId: "change-5",
      competitorId: "comp-3",
      strategy: "COUNTER" as const,
      impact: 8,
      effort: 7,
      title: "Differentiate with premium delivery options",
      rationale:
        "Rather than matching same-day delivery, focus on premium delivery experience (white glove service, scheduled delivery windows).",
      checklist: [
        { id: "c1", text: "Research delivery partners", done: false },
        { id: "c2", text: "Calculate implementation costs", done: false },
        { id: "c3", text: "Build delivery selection UI", done: false },
      ],
      status: "open" as const,
    },
    {
      id: "rec-6",
      changeEventId: "change-6",
      competitorId: "comp-4",
      strategy: "MATCH" as const,
      impact: 9,
      effort: 2,
      title: "Upgrade to 2-day shipping",
      rationale:
        "Beauty Bliss now offers free 2-day shipping on all orders. This is a significant competitive advantage we should match quickly.",
      checklist: [
        { id: "c1", text: "Negotiate with shipping carrier", done: false },
        { id: "c2", text: "Update shipping logic", done: false },
        { id: "c3", text: "Announce the upgrade", done: false },
      ],
      status: "open" as const,
    },
    {
      id: "rec-7",
      changeEventId: "change-7",
      competitorId: "comp-4",
      strategy: "MATCH" as const,
      impact: 6,
      effort: 3,
      title: "Add cart incentive samples",
      rationale:
        "Cart incentives increase AOV. Consider adding free samples at a similar threshold to encourage larger purchases.",
      checklist: [
        { id: "c1", text: "Source sample products", done: false },
        { id: "c2", text: "Set threshold and rules", done: false },
        { id: "c3", text: "Update cart UI", done: false },
      ],
      status: "open" as const,
    },
    {
      id: "rec-8",
      changeEventId: "change-8",
      competitorId: "comp-2",
      strategy: "TEST" as const,
      impact: 7,
      effort: 3,
      title: "Test cart progress bar with gift unlock",
      rationale:
        "Cart threshold messaging can increase AOV by 15-20%. Test with a free gift or discount unlock mechanism.",
      checklist: [
        { id: "c1", text: "Design progress bar component", done: true },
        { id: "c2", text: "Implement cart threshold logic", done: false },
        { id: "c3", text: "A/B test for 2 weeks", done: false },
      ],
      status: "open" as const,
    },
    {
      id: "rec-9",
      changeEventId: "change-9",
      competitorId: "comp-1",
      strategy: "IGNORE" as const,
      impact: 5,
      effort: 4,
      title: "Consider new customer discount later",
      rationale:
        "We already have a strong acquisition funnel. Focus on retention strategies before adding new customer discounts.",
      checklist: [
        { id: "c1", text: "Review acquisition metrics", done: true },
        { id: "c2", text: "Revisit in Q2", done: false },
      ],
      status: "snoozed" as const,
      snoozedUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "rec-10",
      changeEventId: "change-10",
      competitorId: "comp-5",
      strategy: "IGNORE" as const,
      impact: 3,
      effort: 8,
      title: "Monitor outdoor competitor strategy",
      rationale:
        "Outdoor Adventures serves a different segment. Track their strategy but no immediate action needed.",
      checklist: [{ id: "c1", text: "Set up monthly review", done: true }],
      status: "done" as const,
    },
  ];

  const lastWeekDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgoDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const weeklyPulses = [
    {
      id: "pulse-1",
      weekOf: getWeekStart(now).toISOString(),
      totals: {
        changes: 8,
        promos: 3,
        shipping: 2,
        bundles: 1,
        cart: 2,
      },
      highlights: [
        {
          title: "Major shipping upgrades detected",
          detail:
            "2 competitors upgraded to faster/free shipping this week. Consider matching to stay competitive.",
        },
        {
          title: "Promo intensity increasing",
          detail:
            "Average discount increased from 18% to 23% across tracked competitors.",
        },
        {
          title: "Cart incentives gaining traction",
          detail:
            "Beauty Bliss and TechGear both added cart threshold incentives.",
        },
      ],
      topMoves: changeEvents.slice(0, 5),
      recommendations: recommendations.slice(0, 6),
    },
    {
      id: "pulse-2",
      weekOf: getWeekStart(lastWeekDate).toISOString(),
      totals: {
        changes: 5,
        promos: 2,
        shipping: 1,
        bundles: 1,
        cart: 1,
      },
      highlights: [
        {
          title: "Home Essentials launched flash sales",
          detail: "30% off flash sale drove significant traffic. Consider testing similar strategy.",
        },
        {
          title: "Bundle offers emerging trend",
          detail: "2 competitors now offering multi-buy deals on accessories.",
        },
      ],
      topMoves: changeEvents.slice(5, 10),
      recommendations: recommendations.slice(6, 10),
    },
  ];

  return {
    workspace: {
      id: "ws-1",
      name: "My Workspace",
    },
    users: [
      {
        id: "user-1",
        name: "Demo User",
        email: "demo@offerpulse.com",
        role: "admin",
      },
      {
        id: "user-2",
        name: "Team Member",
        email: "team@offerpulse.com",
        role: "member",
      },
    ],
    competitors,
    monitorSettings,
    snapshots,
    changeEvents,
    recommendations,
    alertSettings: {
      emailEnabled: true,
      slackEnabled: false,
      slackWebhookUrl: "",
      eventTypes: ["PROMO", "SHIPPING", "BUNDLE", "CART_INCENTIVE", "DELIVERY_RETURNS"],
      minConfidence: "medium",
    },
    weeklyPulses,
    workspaceSettings: {
      defaultFrequency: "daily",
      defaultTrack: {
        promos: true,
        shipping: true,
        bundles: true,
        cart: true,
        deliveryReturns: true,
      },
    },
  };
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
  return new Date(d.setDate(diff));
}

// Database manager
class MockDB {
  private data: MockDatabase;

  constructor() {
    this.data = this.loadFromStorage() || generateSeedData();
  }

  private loadFromStorage(): MockDatabase | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private saveToStorage(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // Storage failed, continue without persistence
    }
  }

  getData(): MockDatabase {
    return this.data;
  }

  setData(data: MockDatabase): void {
    this.data = data;
    this.saveToStorage();
  }

  reset(): void {
    this.data = generateSeedData();
    this.saveToStorage();
  }
}

export const mockDB = new MockDB();
