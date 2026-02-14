import Link from "next/link";
import { Container } from "@/components/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { COMPETITORS, getCompetitorsByCategory } from "@/lib/compare/competitors";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OfferPulse Comparisons - vs Competitors & Alternatives | OfferPulse",
  description:
    "Compare OfferPulse with competitor monitoring tools. See how offer intelligence differs from price monitoring for Shopify stores.",
  keywords: [
    "offerpulse comparison",
    "competitor monitoring comparison",
    "price monitoring alternatives",
    "offer intelligence vs price intelligence",
  ],
  alternates: {
    canonical: "/compare",
  },
};

export default function ComparePage() {
  const promoIntelligence = getCompetitorsByCategory("promo-intelligence");
  const priceMonitoring = getCompetitorsByCategory("price-monitoring");
  const websiteMonitoring = getCompetitorsByCategory("website-monitoring");

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50 to-white py-16 sm:py-24">
        <Container className="max-w-4xl">
          <Badge className="mb-6">Comparisons</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            OfferPulse Comparisons
          </h1>
          <p className="mt-6 text-xl text-slate-700 leading-relaxed">
            How OfferPulse compares to other competitive intelligence tools. The key difference: we track promotional offers (free shipping thresholds, bundles, gifts, cart incentives), not just product prices.
          </p>

          <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6">
            <h2 className="font-semibold text-slate-900">Offer Intelligence vs Price Monitoring</h2>
            <p className="mt-2 text-sm text-slate-700 leading-relaxed">
              Most tools track when a competitor changes a product price from £25 to £22. OfferPulse tracks when they change their free shipping threshold from £50 to £35, add a "Buy 2 Get 1" bundle, or introduce a gift-with-purchase offer. These offer changes drive strategic decisions about conversion and margin.
            </p>
          </div>
        </Container>
      </section>

      {/* Promo Intelligence Competitors */}
      <section className="border-b border-slate-200 py-16">
        <Container className="max-w-5xl">
          <h2 className="mb-8 text-2xl font-bold text-slate-900">Promotional Intelligence Platforms</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {promoIntelligence.map((competitor) => (
              <CompetitorCard key={competitor.slug} competitor={competitor} />
            ))}
          </div>
        </Container>
      </section>

      {/* Price Monitoring Tools */}
      <section className="border-b border-slate-200 bg-slate-50 py-16">
        <Container className="max-w-5xl">
          <h2 className="mb-8 text-2xl font-bold text-slate-900">Price Monitoring Tools</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {priceMonitoring.map((competitor) => (
              <CompetitorCard key={competitor.slug} competitor={competitor} />
            ))}
          </div>
        </Container>
      </section>

      {/* Website Monitoring Tools */}
      <section className="border-b border-slate-200 py-16">
        <Container className="max-w-5xl">
          <h2 className="mb-8 text-2xl font-bold text-slate-900">Website Monitoring Tools</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {websiteMonitoring.map((competitor) => (
              <CompetitorCard key={competitor.slug} competitor={competitor} />
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-16">
        <Container className="max-w-3xl">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-slate-900">Try OfferPulse Free</h2>
              <p className="mt-3 text-slate-700">
                See what offers your competitors are running right now
              </p>
              <Button asChild size="lg" className="mt-6">
                <Link href="/free-tools/offer-snapshot/tool">Generate free snapshot</Link>
              </Button>
            </CardContent>
          </Card>
        </Container>
      </section>
    </div>
  );
}

function CompetitorCard({ competitor }: { competitor: typeof COMPETITORS[0] }) {
  const categoryLabels = {
    "promo-intelligence": "Promo Intelligence",
    "price-monitoring": "Price Monitoring",
    "website-monitoring": "Website Monitoring",
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <Badge className="mb-2 w-fit">{categoryLabels[competitor.category]}</Badge>
        <CardTitle>{competitor.name}</CardTitle>
        <p className="text-sm text-slate-600">{competitor.positioning}</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="flex-1 space-y-2">
          <Link href={`/compare/offerpulse-vs-${competitor.slug}`}>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 p-0 text-blue-600">
              OfferPulse vs {competitor.name}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/compare/${competitor.slug}-alternatives`}>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 p-0 text-blue-600">
              {competitor.name} alternatives
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/compare/${competitor.slug}-review`}>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 p-0 text-blue-600">
              {competitor.name} review
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
