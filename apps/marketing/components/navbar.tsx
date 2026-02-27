"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Menu, X } from "lucide-react"
import { cn } from "@offerpulse/lib/utils"
import { OfferPulseMark } from "@/components/OfferPulseMark"
import { track } from "@/lib/analytics"
import { buildAppSignupUrl, getStoredCompetitorUrl } from "@offerpulse/lib/routing"
import { normalizeUrl, validateUrl } from "@/lib/url-helpers"

const navLinks = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/free-tools", label: "Free tools" },
  { href: "/guides/pricing-intelligence-vs-offer-intelligence", label: "Guides" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
]

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleGetStarted = () => {
    const storedUrl = getStoredCompetitorUrl()
    let competitorUrl: string | undefined

    if (storedUrl) {
      const normalizedUrl = normalizeUrl(storedUrl)
      const validation = validateUrl(storedUrl)
      if (validation.ok && normalizedUrl) {
        competitorUrl = normalizedUrl
      }
    }

    const destination = buildAppSignupUrl({
      competitorUrl,
      source: "navbar",
    })

    track("marketing_cta_clicked", {
      source: "navbar",
      destination,
      hasStoredUrl: !!storedUrl,
    })

    window.location.href = destination
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-bg/90 backdrop-blur-nav shadow-sm" role="banner">
      <nav 
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link 
          href="/" 
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-80"
          aria-label="OfferPulse home"
        >
          <OfferPulseMark size={28} animated />
          <span className="text-xl font-bold tracking-tight text-ink">
            OfferPulse
          </span>
          <Badge 
            variant="secondary" 
            className="ml-2 hidden rounded-full border border-primary/20 bg-primary-tint px-2.5 py-0.5 text-xs font-medium text-primary sm:inline-flex"
          >
            Early Access
          </Badge>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-7 md:flex" role="navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-body transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA Button */}
        <div className="hidden md:block">
          <Button size="default" onClick={handleGetStarted}>
            Get started
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-controls="mobile-menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        className={cn(
          "md:hidden transition-all duration-200 ease-in-out",
          mobileMenuOpen ? "block animate-in slide-in-from-top-2" : "hidden"
        )}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="border-t border-border bg-bg px-4 pb-5 pt-3 shadow-lg">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-lg px-4 py-2.5 text-base font-medium text-body transition-colors hover:bg-muted hover:text-ink"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => {
                setMobileMenuOpen(false)
                handleGetStarted()
              }}
            >
              Get started
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
