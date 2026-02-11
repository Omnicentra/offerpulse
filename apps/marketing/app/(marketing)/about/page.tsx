import { Container } from "@/components/container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CANONICAL_BASE_URL, ORGANIZATION } from "@/lib/seo/config";
import { CheckCircle, Zap, Shield } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About OfferPulse | Competitor Monitoring for Shopify",
  description:
    "OfferPulse helps Shopify store owners stay competitive by automatically monitoring competitor offers and sending instant alerts when anything changes.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORGANIZATION.name,
    legalName: ORGANIZATION.legalName,
    url: ORGANIZATION.url,
    logo: ORGANIZATION.logo,
    description: ORGANIZATION.description,
    foundingDate: ORGANIZATION.foundingDate,
    email: ORGANIZATION.email,
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50 to-white py-16 sm:py-24">
        <Container className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            About OfferPulse
          </h1>
          <p className="mt-6 text-xl text-slate-700 leading-relaxed">
            We help Shopify store owners and ecommerce managers stay competitive by automatically monitoring competitor offers and alerting them the moment anything changes.
          </p>
        </Container>
      </section>

      {/* Mission */}
      <section className="border-b border-slate-200 py-16">
        <Container className="max-w-4xl">
          <h2 className="text-2xl font-bold text-slate-900">Our Mission</h2>
          <p className="mt-4 text-lg text-slate-700 leading-relaxed">
            Most ecommerce store owners track competitors manually—checking websites weekly, noting changes in spreadsheets, and hoping they don't miss important promotional moves. This doesn't scale and it's too slow.
          </p>
          <p className="mt-4 text-lg text-slate-700 leading-relaxed">
            OfferPulse solves this by automatically monitoring competitor offers (discounts, bundles, free shipping thresholds, cart incentives) and alerting you within minutes when something changes. You get the before/after details plus strategic guidance on whether to match, counter, or ignore the change.
          </p>
        </Container>
      </section>

      {/* What We Do */}
      <section className="border-b border-slate-200 bg-slate-50 py-16">
        <Container className="max-w-4xl">
          <h2 className="mb-8 text-2xl font-bold text-slate-900">What We Track</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              {
                icon: Zap,
                title: "Promotional Offers",
                description: "Percentage discounts, fixed amount offers, promotional codes, flash sales",
              },
              {
                icon: CheckCircle,
                title: "Shipping Thresholds",
                description: "Free shipping requirements, delivery speed offers, shipping policy changes",
              },
              {
                icon: Shield,
                title: "Bundle Deals",
                description: "BOGO offers, multi-buy deals, product pairing, bundle promotions",
              },
              {
                icon: Zap,
                title: "Cart Incentives",
                description: "Progress bars, unlock thresholds, gift with purchase, cart messaging",
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* What We Don't Do */}
      <section className="border-b border-slate-200 py-16">
        <Container className="max-w-4xl">
          <h2 className="text-2xl font-bold text-slate-900">What We Don't Do</h2>
          <div className="mt-6 space-y-4 text-slate-700">
            <p>
              <strong>We don't scrape customer data or private information.</strong> We only track publicly visible promotional content that any visitor can see.
            </p>
            <p>
              <strong>We don't recommend blindly copying competitors.</strong> Our alerts include strategic context—match, counter, or ignore—based on positioning.
            </p>
            <p>
              <strong>We're not a price monitoring tool.</strong> We focus on offer structure (free shipping, bundles, discounts) rather than individual product prices, because offers drive broader strategic decisions.
            </p>
          </div>
        </Container>
      </section>

      {/* How It Works */}
      <section className="border-b border-slate-200 bg-slate-50 py-16">
        <Container className="max-w-4xl">
          <h2 className="mb-8 text-2xl font-bold text-slate-900">How the Free Snapshot Works</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                1
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Enter Competitor URL</h3>
                <p className="mt-1 text-slate-700">
                  Paste any Shopify or ecommerce store URL into our free snapshot tool
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                2
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">We Extract Offers</h3>
                <p className="mt-1 text-slate-700">
                  Our system scans the homepage, headers, and banners for promotional content
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                3
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Get Structured Results</h3>
                <p className="mt-1 text-slate-700">
                  See detected offers with evidence text, location, and confidence ratings
                </p>
              </div>
            </div>
          </div>
          <Button asChild size="lg" className="mt-8">
            <Link href="/free-tools/offer-snapshot">Try free snapshot tool</Link>
          </Button>
        </Container>
      </section>

      {/* Getting Started */}
      <section className="py-16">
        <Container className="max-w-4xl">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900">Get Started</h2>
              <p className="mt-4 text-slate-700">
                Start with our free tools to see what competitors are currently offering, then upgrade to OfferPulse Pro for automatic monitoring and instant alerts.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Button asChild size="lg">
                  <Link href="/free-tools">Explore free tools</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/pricing">View pricing</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>
    </div>
  );
}
