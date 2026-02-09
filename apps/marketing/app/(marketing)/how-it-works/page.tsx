import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SectionHeading } from "@/components/section-heading"
import { HowItWorksSteps } from "@/components/how-it-works-steps"
import { CtaSection } from "@/components/cta-section"
import {
  CheckCircle,
  Zap,
  Shield,
  Target,
  TrendingUp,
  Truck,
  Gift,
  Tag,
  RotateCcw,
  ArrowRight,
} from "lucide-react"

export const metadata: Metadata = {
  title: "How It Works | OfferPulse",
  description:
    "Learn how OfferPulse monitors competitor offers and alerts you to changes in promos, bundles, shipping thresholds, and more.",
  openGraph: {
    title: "How It Works | OfferPulse",
    description:
      "Learn how OfferPulse monitors competitor offers and alerts you to changes.",
  },
}

const whatCounts = [
  {
    icon: Tag,
    title: "Discount changes",
    description:
      "New percentage or fixed-amount discounts, flash sales, or sitewide promotions.",
  },
  {
    icon: Truck,
    title: "Shipping threshold changes",
    description:
      "Free shipping minimums going up or down, new delivery options appearing.",
  },
  {
    icon: Gift,
    title: "Bundle offer updates",
    description:
      "New multi-buy deals, BOGO offers, or changes to existing bundle pricing.",
  },
  {
    icon: RotateCcw,
    title: "Policy changes",
    description:
      "Returns policy updates, delivery promises, or guarantee messaging changes.",
  },
]

const useCases = [
  {
    title: "React to competitor sales",
    description:
      "Get alerted the moment a competitor launches a promotion. Decide whether to match, undercut, or differentiate — before you lose sales.",
    example:
      "Competitor launched '20% OFF weekend sale'. You launched a competing '25% OFF + free shipping' within 2 hours.",
  },
  {
    title: "Test shipping thresholds",
    description:
      "Monitor how competitors adjust their free shipping minimums. Use their experiments to inform your own threshold testing.",
    example:
      "Competitor dropped free shipping from £50 to £35. You tested £40 and saw a 12% increase in conversion.",
  },
  {
    title: "Bundle instead of discount",
    description:
      "Spot when competitors use bundles instead of straight discounts. Multi-buy offers often perform better on perceived value.",
    example:
      "Instead of matching a 15% discount, you launched a 'Buy 2, get 1 free' offer with higher margins.",
  },
]

export default function HowItWorksPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="How it works"
            title="From setup to insight in minutes"
            description="OfferPulse continuously monitors your competitors' promotional activity and delivers actionable intelligence straight to your inbox."
          />
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <HowItWorksSteps detailed />
        </div>
      </section>

      {/* The Monitoring Process */}
      <section className="bg-muted/30 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Under the hood"
            title="What happens when we monitor"
            description="A look at how OfferPulse detects and categorises competitor offers."
          />

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="mt-4">Regular page checks</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                We visit your competitors&apos; pages multiple times per day,
                capturing the current state of their offers, messaging, and
                promotional elements.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="mt-4">Smart detection</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Our system identifies promotional content: discount codes,
                shipping thresholds, bundle deals, cart incentives, and trust
                signals. We filter out noise and focus on what matters.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="mt-4">Change comparison</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                When we detect something different from the previous snapshot,
                we categorise the change, generate before/after comparisons, and
                prepare your alert.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What Counts as a Change */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="What counts as an offer change?"
            description="OfferPulse alerts you to changes that could impact your competitive position."
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {whatCounts.map((item) => (
              <Card key={item.title}>
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <item.icon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="bg-muted/30 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Use cases"
            title="How sellers use OfferPulse"
            description="Real scenarios where competitive intelligence makes the difference."
          />

          <div className="mt-12 space-y-8">
            {useCases.map((useCase, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {useCase.title}
                      </h3>
                      <p className="mt-2 text-muted-foreground">
                        {useCase.description}
                      </p>
                    </div>
                    <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-accent">
                        <TrendingUp className="h-4 w-4" />
                        Example outcome
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {useCase.example}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Alert Delivery */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading
                badge="Delivery"
                title="Alerts that fit your workflow"
                description="Choose how you want to receive competitive intelligence."
                centered={false}
              />
              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <div>
                    <span className="font-medium text-foreground">
                      Instant email alerts
                    </span>
                    <p className="text-sm text-muted-foreground">
                      Get notified the moment we detect a change. Available on
                      Growth and Agency plans.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <div>
                    <span className="font-medium text-foreground">
                      Slack integration
                    </span>
                    <p className="text-sm text-muted-foreground">
                      Pipe alerts directly to your team&apos;s Slack channel for
                      quick discussion and action.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <div>
                    <span className="font-medium text-foreground">
                      Weekly digest
                    </span>
                    <p className="text-sm text-muted-foreground">
                      A Monday morning summary of all competitor activity.
                      Perfect for strategic planning.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            <Card className="bg-muted/50">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="rounded border bg-background p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-block h-2 w-2 rounded-full bg-success" />
                      Instant alert
                    </div>
                    <p className="mt-2 text-sm font-medium">
                      competitor-store.com changed their free shipping threshold
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      2 minutes ago
                    </p>
                  </div>
                  <div className="rounded border bg-background p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-block h-2 w-2 rounded-full bg-warning" />
                      Weekly digest
                    </div>
                    <p className="mt-2 text-sm font-medium">
                      Your Competitive Pulse for this week
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      12 changes across 5 competitors
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Get Started */}
      <section className="bg-muted/30 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <SectionHeading
            title="Ready to see it in action?"
            description="Try a free Offer Snapshot on any competitor's store. No account required."
          />
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/#snapshot">
                Try free snapshot
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <CtaSection />
    </>
  )
}
