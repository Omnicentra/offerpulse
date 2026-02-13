import { Metadata } from "next"
import { SectionHeading } from "@/components/section-heading"
import { PricingSection } from "@/components/pricing-section"
import { PricingViewTracker } from "@/components/pricing-view-tracker"
import { CtaSection } from "@/components/cta-section"
import { CheckCircle } from "lucide-react"
import { BillingFaq } from "@/components/billing-faq"
import { PRICING_PLANS } from "@offerpulse/lib/pricing"
import { CANONICAL_BASE_URL } from "@/lib/seo/config"

export const metadata: Metadata = {
  title: "Pricing - Competitor Offer Monitoring for Shopify Stores | OfferPulse",
  description:
    "Track competitor offers automatically from £19/mo. Monitor discounts, bundles, free shipping thresholds, and cart incentives. 14-day free trial, no credit card required.",
  keywords: [
    "competitor monitoring pricing",
    "shopify competitor tracking cost",
    "offer monitoring pricing",
    "promotional tracking software pricing",
  ],
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing - Competitor Offer Monitoring | OfferPulse",
    description:
      "Track competitor offers from £19/mo. All plans include instant alerts and change tracking.",
    url: `${CANONICAL_BASE_URL}/pricing`,
  },
  twitter: {
    card: "summary_large_image",
    title: "OfferPulse Pricing",
    description: "Track competitor offers from £19/mo. 14-day free trial.",
  },
}

export default function PricingPage() {
  // Generate SoftwareApplication schema with pricing offers
  const pricingSchemas = PRICING_PLANS.map((plan) => ({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `OfferPulse ${plan.name}`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: [
      {
        "@type": "Offer",
        name: `${plan.name} Monthly`,
        price: plan.monthlyPrice,
        priceCurrency: "GBP",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: plan.monthlyPrice,
          priceCurrency: "GBP",
          unitText: "MONTH",
        },
      },
      {
        "@type": "Offer",
        name: `${plan.name} Yearly`,
        price: plan.yearlyPrice,
        priceCurrency: "GBP",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: plan.yearlyPrice,
          priceCurrency: "GBP",
          unitText: "YEAR",
        },
      },
    ],
  }));

  return (
    <>
      {/* Pricing Schema */}
      {pricingSchemas.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      
      <PricingViewTracker />
      {/* Header */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Pricing"
            title="Simple, transparent pricing"
            description="Start tracking competitor offers today. All plans include a 14-day free trial with no credit card required."
          />

          {/* Value props */}
          <div className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing: toggle, cards, comparison */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <PricingSection />
          <div className="mt-10 rounded-2xl border border-border bg-muted/30 px-5 py-4 text-center">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">No credit card required</strong> for the 14-day free trial.
            </p>
          </div>
        </div>
      </section>

      {/* Billing FAQ */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Billing FAQ"
            description="Everything you need to know about billing and plans."
          />
          <div className="mt-12">
            <BillingFaq />
          </div>
        </div>
      </section>

      {/* CTA */}
      <CtaSection
        title="Ready to start tracking?"
        description="Join early access today. 14-day free trial, no credit card required."
      />
    </>
  )
}
