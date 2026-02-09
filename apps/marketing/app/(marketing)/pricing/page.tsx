import { Metadata } from "next"
import { SectionHeading } from "@/components/section-heading"
import { PricingSection } from "@/components/pricing-section"
import { PricingViewTracker } from "@/components/pricing-view-tracker"
import { CtaSection } from "@/components/cta-section"
import { CheckCircle } from "lucide-react"
import { BillingFaq } from "@/components/billing-faq"

export const metadata: Metadata = {
  title: "Pricing | OfferPulse",
  description:
    "Simple, transparent pricing for competitor offer monitoring. Start with a 14-day free trial. No credit card required.",
  openGraph: {
    title: "Pricing | OfferPulse",
    description:
      "Simple, transparent pricing for competitor offer monitoring. Start with a 14-day free trial.",
  },
}

export default function PricingPage() {
  return (
    <>
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
