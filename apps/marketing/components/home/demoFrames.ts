/**
 * Frame definitions for checkout reveal animation
 * Shows how offers change while price stays the same
 */

export interface DemoFrame {
  id: number;
  title: string;
  duration: number; // seconds
  elements: {
    productTitle?: string;
    price: string;
    button?: string;
    lineItems?: Array<{ label: string; value: string; highlight?: boolean; tooltip?: string }>;
    offers?: Array<{ text: string; highlight?: boolean; tooltip?: string }>;
    total?: string;
    showSummary?: boolean;
  };
  badge: {
    text: string;
    type: "monitoring" | "detected";
  };
}

export const demoFrames: DemoFrame[] = [
  {
    id: 1,
    title: "Product Page",
    duration: 2.5,
    elements: {
      productTitle: "Everyday Hoodie",
      price: "£49",
      button: "Add to cart",
    },
    badge: {
      text: "Price monitoring: No price change",
      type: "monitoring",
    },
  },
  {
    id: 2,
    title: "Cart View",
    duration: 2.5,
    elements: {
      price: "£49",
      lineItems: [
        { label: "Everyday Hoodie", value: "£49" },
        { label: "Subtotal", value: "£49" },
      ],
      button: "Checkout",
    },
    badge: {
      text: "Price monitoring: Still no price change",
      type: "monitoring",
    },
  },
  {
    id: 3,
    title: "Checkout Reveal",
    duration: 3,
    elements: {
      price: "£49",
      lineItems: [
        { label: "Subtotal", value: "£49" },
        {
          label: "Free shipping over £35",
          value: "£0.00",
          highlight: true,
          tooltip: "Threshold changed: £50 → £35",
        },
        { label: "Total", value: "£49" },
      ],
      showSummary: false,
    },
    badge: {
      text: "OfferPulse detected",
      type: "detected",
    },
  },
  {
    id: 4,
    title: "Offer Stack",
    duration: 4,
    elements: {
      price: "£49",
      lineItems: [
        { label: "Subtotal", value: "£49" },
        { label: "Free shipping over £35", value: "£0.00", highlight: true },
        { label: "Total", value: "£49" },
      ],
      offers: [
        { text: "Bundle: Buy 2 save 15%", highlight: true, tooltip: "Bundle added" },
        { text: "Gift: Travel pouch included", highlight: true, tooltip: "GWP added" },
        { text: "Spend £80 get £10 off", highlight: false },
      ],
      showSummary: true,
    },
    badge: {
      text: "OfferPulse detected",
      type: "detected",
    },
  },
];

export const offerChangeSummary = [
  { change: "Free shipping threshold", detail: "£50 → £35" },
  { change: "Bundle added", detail: "Buy 2 save 15%" },
  { change: "Gift added", detail: "Travel pouch" },
];

export const suggestedResponse = "Match threshold or add bundle";
