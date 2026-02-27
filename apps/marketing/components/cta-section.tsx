"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { track } from "@/lib/analytics"
import { buildAppSignupUrl, getStoredCompetitorUrl } from "@offerpulse/lib/routing"

interface CtaSectionProps {
  title?: string
  description?: string
  primaryText?: string
  primaryHref?: string
  secondaryText?: string
  secondaryHref?: string
}

export function CtaSection({
  title = "Ready to stay ahead?",
  description = "Join Shopify sellers who track competitors on autopilot.",
  primaryText = "Start your free trial",
  primaryHref,
  secondaryText = "View pricing",
  secondaryHref = "/pricing",
}: CtaSectionProps) {
  const isSignupCta = primaryHref === "/snapshot" || primaryHref == null

  const handlePrimaryCtaClick = () => {
    track("cta_signup_clicked", { source: "cta_section" })
    if (isSignupCta) {
      const signupUrl = buildAppSignupUrl({
        competitorUrl: getStoredCompetitorUrl() ?? undefined,
        source: "cta_section",
      })
      track("landing_cta_clicked", {
        source: "cta_section",
        action: "primary_cta",
        cta_text: primaryText,
        destination: signupUrl,
      })
      window.location.href = signupUrl
    } else {
      track("landing_cta_clicked", {
        source: "cta_section",
        action: "primary_cta",
        cta_text: primaryText,
        destination: primaryHref,
      })
    }
  }

  const handleSecondaryCtaClick = () => {
    track("landing_cta_clicked", {
      source: "cta_section",
      action: "secondary_cta",
      cta_text: secondaryText,
      destination: secondaryHref,
    })
  }

  return (
    <section className="relative overflow-hidden border-t border-border py-24 sm:py-32">
      <div className="absolute inset-0 electric-glow opacity-50" aria-hidden />
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-tint px-4 py-1.5 text-sm font-medium text-primary mb-8">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
          </span>
          500+ stores monitoring competitors
        </div>
        <h2 className="text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl lg:text-6xl">
          {title}
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-xl leading-relaxed text-body">
          {description}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {isSignupCta ? (
            <Button size="lg" onClick={handlePrimaryCtaClick}>
              {primaryText}
            </Button>
          ) : (
            <Button asChild size="lg" onClick={handlePrimaryCtaClick}>
              <Link href={primaryHref!}>
                {primaryText}
              </Link>
            </Button>
          )}
          {secondaryText && secondaryHref && (
            <Button asChild variant="outline" size="lg" onClick={handleSecondaryCtaClick}>
              <Link href={secondaryHref}>{secondaryText}</Link>
            </Button>
          )}
        </div>
        <p className="mt-8 text-sm text-body/70">
          14-day free trial • No credit card • Cancel anytime
        </p>
      </div>
    </section>
  )
}
