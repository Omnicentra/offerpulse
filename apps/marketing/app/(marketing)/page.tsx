"use client"

import type { OfferSnapshotResponse } from "@/app/api/offer-snapshot/route"
import { Container } from "@/components/container"
import { CtaSection } from "@/components/cta-section"
import { FaqAccordion } from "@/components/faq-accordion"
import { HeroProductTheatre } from "@/components/hero-product-theatre"
import { CheckoutRevealSection } from "@/components/home/CheckoutRevealSection"
import { HowItWorksStepper } from "@/components/how-it-works-stepper"
import { InputAnnotation } from "@/components/input-annotation"
import { OfferSnapshotForm } from "@/components/offer-snapshot-form"
import { OfferSnapshotTeaser } from "@/components/offer-snapshot-teaser"
import { PricingCards } from "@/components/pricing-cards"
import { PricingToggle } from "@/components/pricing-toggle"
import { ReportPreview } from "@/components/report-preview"
import { ScrollReveal } from "@/components/scroll-reveal"
import { Section } from "@/components/section"
import { TestimonialCard } from "@/components/testimonial-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { WhatWeTrackTabs } from "@/components/what-we-track-tabs"
import { track } from "@/lib/analytics"
import { buildAppSignupUrl } from "@offerpulse/lib/routing"
import { extractDomain } from "@offerpulse/lib/utils"
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle,
  Mail,
  TrendingUp,
  XCircle,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

const testimonials = [
  {
    quote:
      "We were reacting to competitor promos days late. Now we see changes the same morning and can adjust our own offers before lunch.",
    role: "DTC Operator, skincare brand",
    image: "/testimonials/testimonial-1.png",
  },
  {
    quote:
      "Our clients expect us to know what's happening in their category. OfferPulse gives us the proof and the timeline — no more guesswork.",
    role: "Agency Owner, 12 Shopify stores",
    image: "/testimonials/testimonial-2.png",
  },
  {
    quote:
      "The free shipping threshold alerts alone have paid for the tool. We matched a competitor's drop to £35 and saw AOV hold steady.",
    role: "Head of E‑commerce, fashion",
    image: "/testimonials/testimonial-3.png",
  },
]

function getPreviewDomain(rawUrl: string): string {
  const trimmed = rawUrl.trim()
  if (!trimmed) return "competitor-store.com"
  try {
    if (!/^https?:\/\//i.test(trimmed)) return "competitor-store.com"
    const d = extractDomain(trimmed)
    return d || "competitor-store.com"
  } catch {
    return "competitor-store.com"
  }
}

export default function HomePage() {
  const [snapshotData, setSnapshotData] = useState<OfferSnapshotResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewDomain, setPreviewDomain] = useState("competitor-store.com")
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly")

  // Track landing page view on mount
  useEffect(() => {
    track("landing_page_viewed", {
      page: "home",
      referrer: typeof window !== "undefined" ? document.referrer : undefined,
    })
  }, [])

  const handleUrlChange = useCallback((rawUrl: string) => {
    setPreviewDomain(getPreviewDomain(rawUrl))
  }, [])

  return (
    <>
      {/* Hero — 2-column: left copy + form, right product theatre */}
      <section className="relative overflow-hidden border-b border-border pb-20 pt-12 sm:pb-28 sm:pt-16 lg:pb-36 lg:pt-20">
        <div className="absolute inset-0 electric-glow" aria-hidden />
        <Container className="relative">
          <div className="grid items-start gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            {/* Left: headline, subtext, bullets, form */}
            <div className="order-1 lg:order-1">
              <Badge
                variant="secondary"
                className="mb-2 inline-flex rounded-full border border-primary/20 bg-primary-tint px-3 py-1 text-sm font-medium text-primary"
              >
                🚀 Join 500+ Shopify sellers
              </Badge>
              <p className="mb-6 text-sm text-body/80">
                Tracking 10,000+ promo changes/month
              </p>
              <h1 className="mt-2 text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-6xl">
                Never miss a competitor&apos;s promo change again
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-body sm:text-xl">
                OfferPulse tracks competitor discounts, bundles, free-shipping thresholds and cart incentives — and alerts you instantly with suggested actions to protect conversion and AOV.
              </p>
              <div className="relative mt-16 sm:mt-20">
                <InputAnnotation />
                <OfferSnapshotForm
                  onUrlChange={handleUrlChange}
                />
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-lg bg-mint-tint/50 px-3 py-2">
                  <CheckCircle className="h-4 w-4 text-mint" />
                  <span className="text-sm font-medium text-ink">Before/after proof</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-mint-tint/50 px-3 py-2">
                  <Bell className="h-4 w-4 text-mint" />
                  <span className="text-sm font-medium text-ink">Real-time alerts</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-mint-tint/50 px-3 py-2">
                  <Calendar className="h-4 w-4 text-mint" />
                  <span className="text-sm font-medium text-ink">Set up alerts in 2 minutes</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-body/70">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-mint" />
                    <span>No credit card</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-mint" />
                    <span>Free snapshot</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Image 
                      src="/logos/shopify.svg" 
                      alt="" 
                      width={16} 
                      height={16} 
                      className="opacity-70"
                    />
                    <span>Works with Shopify</span>
                  </div>
              </div>
            </div>

            {/* Right: Product theatre stack */}
            <div className="order-2 lg:order-2 lg:sticky lg:top-24">
              <HeroProductTheatre domain={previewDomain} />
            </div>
          </div>

          {/* Snapshot results: error or success with blur + CTA */}
          {(snapshotData || error) && (
            <div className="mx-auto mt-16 max-w-3xl">
              {error && (
                <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
                  <CardContent className="flex items-center gap-3 p-5">
                    <XCircle className="h-5 w-5 shrink-0 text-destructive" />
                    <div>
                      <p className="font-semibold text-destructive">Something went wrong</p>
                      <p className="text-sm text-body">{error}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-auto rounded-xl"
                      onClick={() => {
                        setError(null)
                        setSnapshotData(null)
                      }}
                      aria-label="Retry offer snapshot"
                    >
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              )}
              {snapshotData && (
                <div className="relative">
                  <div className="relative rounded-2xl">
                    <OfferSnapshotTeaser data={snapshotData} />
                    <div className="absolute inset-x-0 bottom-0 h-40 rounded-b-2xl bg-gradient-to-t from-background to-transparent pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 rounded-b-2xl bg-gradient-to-t from-bg via-bg to-transparent p-6 pt-24">
                      <div className="text-center">
                        <p className="text-lg font-bold text-ink">
                          Start monitoring this competitor now
                        </p>
                        <p className="mt-2 text-sm text-body/70">
                          14-day free trial • No credit card • Cancel anytime
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-3">
                        <Button 
                          asChild 
                          size="lg" 
                          className="rounded-xl shadow-lg hover:shadow-xl"
                          onClick={() => {
                            track("landing_cta_clicked", {
                              source: "snapshot_result",
                              competitor_url: snapshotData.domain,
                              action: "start_trial"
                            })
                          }}
                        >
                          <Link href={buildAppSignupUrl({
                            competitorUrl: snapshotData.domain,
                            source: "landing_snapshot_result"
                          })}>
                            Start free trial →
                          </Link>
                        </Button>
                        <Button 
                          asChild 
                          variant="outline" 
                          size="lg" 
                          className="rounded-xl"
                          onClick={() => {
                            track("landing_cta_clicked", {
                              source: "snapshot_result",
                              competitor_url: snapshotData.domain,
                              action: "view_pricing"
                            })
                          }}
                        >
                          <Link href="/pricing">View pricing</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 text-center">
                    <p className="text-sm text-body">
                      This was a <strong className="font-semibold text-ink">free one-time snapshot</strong>.
                    </p>
                    <p className="mt-1 text-sm text-body/70">
                      Create an account to get real-time alerts and continuous monitoring.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </Container>
      </section>

      {/* Checkout Reveal - Price vs Offer Intelligence */}
      <CheckoutRevealSection />

      {/* Trust: Testimonials */}
      <Section className="border-b border-border">
        <Container>
          <div className="mt-16">
            <p className="mb-4 text-center text-sm font-medium text-body">
              Loved by Shopify sellers
            </p>
            <h2 className="mb-12 text-center text-2xl font-bold text-ink sm:text-3xl lg:text-4xl">
              See every competitor offer change{" "}
              <span className="relative inline-block">
                <span className="relative z-10">in minutes</span>
                <span className="absolute bottom-0 left-0 right-0 h-2 bg-primary/30 animate-pulse" />
              </span>{" "}
              — not hours
            </h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t, i) => (
                <ScrollReveal key={i} delay={i * 0.1}>
                  <TestimonialCard quote={t.quote} role={t.role} image={t.image} />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Example report: Weekly Competitive Pulse */}
      <Section className="border-b border-border bg-muted/20">
        <Container>
          <ScrollReveal>
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-mint/20 bg-mint-tint px-3 py-1 text-xs font-semibold uppercase tracking-wider text-mint">
                Example report
              </div>
              <h2 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">
                Your Weekly Competitive Pulse
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-body">
                A dashboard-style summary of every offer change across your monitored competitors. This is what you get every Monday.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <div className="mt-14">
              <ReportPreview />
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* Problem */}
      <Section>
        <Container>
          <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber/20 bg-amber-tint px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber">
                The problem
              </div>
              <h2 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">
                Reacting late hurts ROAS and conversion
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-body">
                Your competitors are constantly testing offers — discounts, free shipping thresholds, bundles. When they launch a new promo and you don&apos;t know, shoppers who compare prices will choose them.
              </p>
              <ul className="mt-8 space-y-5">
                <li className="flex items-start gap-4">
                  <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-amber" />
                  <span className="text-base leading-relaxed text-body">
                    Lost sales to competitors running flash promotions you missed
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-amber" />
                  <span className="text-base leading-relaxed text-body">
                    Wasted ad spend driving traffic that converts elsewhere
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-amber" />
                  <span className="text-base leading-relaxed text-body">
                    Manual competitor checks that eat into your time
                  </span>
                </li>
              </ul>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <Card className="rounded-2xl bg-surface shadow-soft">
                <CardContent className="p-7">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-tint px-3 py-1.5 text-sm font-medium text-amber">
                    <Mail className="h-4 w-4" />
                    <span>Missed opportunity</span>
                  </div>
                  <div className="space-y-3">
                    <p className="text-lg font-semibold text-ink">
                      Competitor launched &quot;20% OFF&quot; 3 days ago
                    </p>
                    <p className="text-body leading-relaxed">
                      You only noticed when your conversion rate dropped 15%. By
                      then, the damage was done.
                    </p>
                  </div>
                  <div className="mt-5 rounded-lg bg-destructive/5 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                      <TrendingUp className="h-4 w-4 rotate-180" />
                      <span>Estimated revenue impact: -£2,400</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </Container>
      </Section>

      {/* What We Track */}
      <Section className="border-t border-border">
        <Container>
          <ScrollReveal>
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-tint px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                What we track
              </div>
              <h2 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">
                Every offer that affects your bottom line
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-body">
                OfferPulse monitors the promotional layer that drives purchasing decisions — not just prices.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.05}>
            <div className="mt-16">
              <WhatWeTrackTabs />
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <div className="mx-auto mt-12 max-w-2xl rounded-xl bg-surface px-6 py-4 shadow-sm ring-1 ring-border/50">
              <p className="text-center text-sm text-body">
                <strong className="font-semibold text-ink">Noise filtering:</strong> We ignore
                content edits and only alert on offer-layer changes.
              </p>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* How It Works */}
      <Section className="bg-muted/20">
        <Container className="max-w-6xl">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-tint px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                How it works
              </div>
              <h2 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
                Set up in minutes, stay ahead forever
              </h2>
              <p className="mt-4 text-base leading-relaxed text-body sm:text-lg">
                No installation required. Paste competitor URLs and we handle the rest.
              </p>
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={0.1}>
            <div className="mt-14">
              <HowItWorksStepper />
            </div>
          </ScrollReveal>

          {/* CTA row */}
          <ScrollReveal delay={0.15}>
            <div className="mt-14 flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-sm text-body/70">
                <span className="inline-flex items-center gap-1.5">
                  <Image
                    src="/logos/shopify.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="opacity-70"
                  />
                  Works with Shopify
                </span>
                <span className="text-body/50">•</span>
                <span>No code</span>
                <span className="text-body/50">•</span>
                <span>Cancel anytime</span>
              </p>
              <Button 
                asChild 
                variant="outline" 
                size="default"
                onClick={() => {
                  track("landing_cta_clicked", {
                    source: "how_it_works_section",
                    action: "learn_more",
                    destination: "/how-it-works"
                  })
                }}
              >
                <Link href="/how-it-works">
                  Learn more
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* Example Alert + Weekly digest */}
      <Section className="border-t border-border">
        <Container>
          <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
            <ScrollReveal>
              <Card className="order-2 rounded-2xl bg-surface shadow-soft lg:order-1">
                <CardContent className="p-7">
                  <div className="mb-5 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Bell className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-semibold text-ink">
                      OfferPulse Alert
                    </span>
                    <div className="ml-auto rounded-full bg-mint/10 px-2.5 py-1 text-xs font-medium text-mint">
                      Just now
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="rounded-xl bg-muted/40 p-5">
                      <p className="text-sm text-body">
                        Change detected on{" "}
                        <span className="font-semibold text-ink">
                          competitor-store.com
                        </span>
                      </p>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                          <p className="text-xs font-medium uppercase tracking-wider text-destructive/70">Before</p>
                          <p className="mt-2 font-semibold text-destructive line-through">
                            Free shipping over £50
                          </p>
                        </div>
                        <div className="rounded-lg border border-mint/20 bg-mint-tint/50 p-4">
                          <p className="text-xs font-medium uppercase tracking-wider text-mint/70">After</p>
                          <p className="mt-2 font-semibold text-mint">
                            Free shipping over £35
                          </p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-relaxed text-body">
                        This £15 drop in threshold could shift basket sizes. Consider
                        adjusting your free shipping minimum to stay competitive.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button size="sm" variant="outline" className="text-sm">View full report</Button>
                      <Button size="sm" variant="ghost" className="text-sm">Dismiss</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <div className="order-1 lg:order-2">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-mint/20 bg-mint-tint px-3 py-1 text-xs font-semibold uppercase tracking-wider text-mint">
                  Real-time alerts
                </div>
                <h2 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
                  Know the moment something changes
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-body">
                  Get instant alerts via email or Slack when competitors update their offers. No more manual checking or nasty surprises.
                </p>
                <ul className="mt-8 space-y-4 text-body">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-mint" />
                    Before/after comparison
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-mint" />
                    Actionable recommendations
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-mint" />
                    Slack and email delivery
                  </li>
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </Container>
      </Section>

      {/* Pricing Preview */}
      <Section className="border-t border-border bg-muted/20">
        <Container>
          <ScrollReveal>
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-tint px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                Pricing
              </div>
              <h2 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">
                Simple, transparent pricing
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-body">
                Start with a 14-day free trial. No credit card required.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.05}>
            <div className="mt-8 flex justify-center">
              <PricingToggle
                value={billingPeriod}
                onValueChange={setBillingPeriod}
              />
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.05}>
            <div className="mt-12">
              <PricingCards billingPeriod={billingPeriod} />
            </div>
          </ScrollReveal>
          <div className="mt-10 text-center">
            <Button 
              asChild 
              variant="outline" 
              className="transition-transform hover:scale-[1.02]"
              onClick={() => {
                track("landing_cta_clicked", {
                  source: "pricing_preview_section",
                  action: "view_full_pricing",
                  destination: "/pricing"
                })
              }}
            >
              <Link href="/pricing">
                View full pricing details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Container>
      </Section>

      {/* FAQ Teaser */}
      <Section className="border-t border-border">
        <Container className="max-w-3xl">
          <ScrollReveal>
            <div className="text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-tint px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                FAQ
              </div>
              <h2 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
                Frequently asked questions
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-body">
                Got questions? We&apos;ve got answers.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.05}>
            <div className="mt-12">
              <FaqAccordion limit={4} />
            </div>
          </ScrollReveal>
          <div className="mt-10 text-center">
            <Button asChild variant="outline" className="transition-transform hover:scale-[1.02]">
              <Link href="/faq">
                View all FAQs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Container>
      </Section>

      {/* Hook Cards - Steal offers don't guess */}
      <Section className="border-b border-border bg-slate-50">
        <Container>
          <ScrollReveal>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                Steal offers — don&apos;t guess
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Real insights from tracking competitor offers
              </p>
            </div>
          </ScrollReveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                hook: "Your competitor just launched a new offer. Would you know within 5 minutes?",
                link: "/free-tools/offer-snapshot",
              },
              {
                hook: "I tracked 10 Shopify brands' promos for 7 days. Here's what wins.",
                link: "/blog",
              },
              {
                hook: "Stop guessing discounts — steal competitor positioning instead.",
                link: "/free-tools/discount-detector",
              },
              {
                hook: "Most brands copy the discount. The real lever is the bundle + threshold.",
                link: "/free-tools/bundle-ideas",
              },
              {
                hook: "Free shipping at £50 or £35? The £15 difference can change everything.",
                link: "/free-tools/free-shipping-threshold",
              },
              {
                hook: "Track competitors who move fast. React faster.",
                link: "/how-it-works",
              },
            ].map((item, idx) => (
              <ScrollReveal key={idx} delay={idx * 0.05}>
                <Link 
                  href={item.link}
                  onClick={() => {
                    track("landing_free_tool_clicked", {
                      tool_link: item.link,
                      hook_text: item.hook
                    })
                  }}
                >
                  <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer">
                    <CardContent className="p-6">
                      <p className="text-sm font-medium leading-relaxed text-slate-700">
                        {item.hook}
                      </p>
                      <Button variant="ghost" size="sm" className="mt-4 gap-2 p-0 text-blue-600">
                        Learn more
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </Section>

      <CtaSection />
    </>
  )
}
