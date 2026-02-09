import { NextResponse } from "next/server"
import { z } from "zod"
import { extractDomain, getPageTypeSlug, delay } from "@offerpulse/lib/utils"

// Signal status values per spec
export type SignalStatus =
  | "Detected"
  | "Not detected"
  | "Found"
  | "Not found"
  | "Possible"

export interface SignalWithSnippet {
  status: SignalStatus
  snippet?: string
}

export interface ShippingThresholdSignal {
  status: SignalStatus
  amount?: number
  currency: "GBP"
}

// Response type exported for client components
export interface OfferSnapshotResponse {
  domain: string
  pageType: "product" | "collection" | "cart" | "home" | "other"
  capturedAt: string
  signals: {
    promo: SignalWithSnippet
    shippingThreshold: ShippingThresholdSignal
    bundle: SignalWithSnippet
    cartIncentive: SignalWithSnippet
    delivery: SignalWithSnippet
    returns: SignalWithSnippet
  }
  whyItMatters: string
}

// Input validation schema
const inputSchema = z.object({
  url: z.string().url("Invalid URL format"),
})

// Mock data pools for realistic variation (spec: British English, GBP)
const promoSnippets = [
  "20% OFF sitewide",
  "15% off with code SAVE15",
  "Flash sale: £10 off orders over £50",
  "Free shipping over £35",
  "3 for 2 on selected lines",
  "Spend £10 more to unlock free gift",
]

const shippingAmounts = [35, 50, 40, 25, 60, 45]

const bundleSnippets = [
  "3 for 2 on selected items",
  "Bundle & save 15%",
  "Mix & match: 2 for £30",
  "Buy 2, get 1 free",
]

const cartIncentiveSnippets = [
  "Spend £10 more for free shipping",
  "Limited time: free gift at checkout",
  "Add £15 to unlock free express delivery",
  "Exit intent: extra 5% off",
]

const deliverySnippets = [
  "Next-day delivery",
  "Free standard delivery (3–5 days)",
  "Express delivery: order by 2pm",
  "Same day delivery in select areas",
]

const returnsSnippets = [
  "30-day returns",
  "Free returns within 28 days",
  "60-day return policy",
  "No-hassle returns",
]

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function detectWithProbability(probability: number): boolean {
  return Math.random() < probability
}

function generateWhyItMatters(
  signals: OfferSnapshotResponse["signals"]
): string {
  const hasPromo = signals.promo.status === "Detected" || signals.promo.status === "Found"
  const hasShipping =
    signals.shippingThreshold.status === "Found" ||
    signals.shippingThreshold.status === "Detected"
  const hasBundle = signals.bundle.status === "Detected" || signals.bundle.status === "Found"
  const hasCart = signals.cartIncentive.status === "Detected" || signals.cartIncentive.status === "Possible"

  if (!hasPromo && !hasShipping && !hasBundle && !hasCart) {
    return "No active offers detected. This competitor may be running at full price — a potential opportunity to differentiate on value."
  }
  if (hasPromo && hasShipping) {
    return "This competitor is running both a discount and free shipping. Combined, these could significantly impact basket size and conversion — consider your response strategy."
  }
  if (hasPromo) {
    return "Active discount detected. Monitor how long this promotion runs and whether it affects your conversion rates."
  }
  if (hasShipping) {
    return "Free shipping threshold identified. Shoppers often adjust basket size to hit these thresholds — this can impact average order value across your market."
  }
  if (hasBundle) {
    return "Bundle offer active. Multi-buy deals often outperform straight discounts on perceived value — consider whether a similar approach would work for your store."
  }
  if (hasCart) {
    return "Cart or checkout incentive detected. These prompts can lift conversion at the last moment — worth tracking over time."
  }
  return "Multiple offer signals detected. Track these over time to understand your competitor's promotional rhythm and plan accordingly."
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const parsed = inputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { url } = parsed.data

    // Simulate processing time (production: headless scrape + noise filtering + snapshot storage)
    await delay(1500 + Math.random() * 1000)

    const domain = extractDomain(url)
    const pageType = getPageTypeSlug(url)
    const isProduct = pageType === "product"
    const isHome = pageType === "home"

    // Build signals with slight randomisation
    const promoDetected = detectWithProbability(isProduct ? 0.7 : 0.6)
    const shippingDetected = detectWithProbability(0.75)
    const bundleDetected = detectWithProbability(isProduct ? 0.5 : 0.35)
    const cartDetected = detectWithProbability(0.4)
    const cartPossible = cartDetected && detectWithProbability(0.3)
    const deliveryDetected = detectWithProbability(0.8)
    const returnsDetected = detectWithProbability(0.65)

    const signals: OfferSnapshotResponse["signals"] = {
      promo: {
        status: promoDetected ? "Detected" : "Not detected",
        snippet: promoDetected ? randomPick(promoSnippets) : undefined,
      },
      shippingThreshold: {
        status: shippingDetected ? "Found" : "Not found",
        amount: shippingDetected ? randomPick(shippingAmounts) : undefined,
        currency: "GBP",
      },
      bundle: {
        status: bundleDetected ? "Detected" : "Not detected",
        snippet: bundleDetected ? randomPick(bundleSnippets) : undefined,
      },
      cartIncentive: {
        status: cartDetected
          ? cartPossible
            ? "Possible"
            : "Detected"
          : "Not detected",
        snippet: cartDetected ? randomPick(cartIncentiveSnippets) : undefined,
      },
      delivery: {
        status: deliveryDetected ? "Found" : "Not found",
        snippet: deliveryDetected ? randomPick(deliverySnippets) : undefined,
      },
      returns: {
        status: returnsDetected ? "Found" : "Not found",
        snippet: returnsDetected ? randomPick(returnsSnippets) : undefined,
      },
    }

    const response: OfferSnapshotResponse = {
      domain,
      pageType,
      capturedAt: new Date().toISOString(),
      signals,
      whyItMatters: generateWhyItMatters(signals),
    }

    return NextResponse.json(response)

    /*
     * FUTURE: Real implementation would:
     * 1. Fetch HTML via headless browser (Puppeteer/Playwright)
     * 2. Parse and detect offers with noise filtering
     * 3. Store snapshot for diff/timeline (after auth)
     */
  } catch (error) {
    console.error("Offer snapshot error:", error)
    return NextResponse.json(
      { error: "Failed to generate snapshot. Please try again." },
      { status: 500 }
    )
  }
}
