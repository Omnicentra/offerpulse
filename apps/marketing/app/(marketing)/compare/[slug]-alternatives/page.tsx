import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getCompetitorBySlug, getAllCompetitorSlugs, COMPETITORS } from "@/lib/compare/competitors";
import { generateAlternativesPageFAQs } from "@/lib/compare/helpers";
import { CANONICAL_BASE_URL } from "@/lib/seo/config";
import { CheckCircle, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllCompetitorSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const competitor = getCompetitorBySlug(slug);

  if (!competitor) return {};

  return {
    title: `Best ${competitor.name} Alternatives for Shopify Promo Monitoring (2026)`,
    description: `Looking for ${competitor.name} alternatives? Compare OfferPulse and other tools for tracking competitor offers, bundles, and shipping thresholds on Shopify.`,
    keywords: [`${competitor.slug} alternatives`, `${competitor.name} competitors`, "promotional monitoring alternatives"],
    alternates: { canonical: `/compare/${slug}-alternatives` },
  };
}

export default async function AlternativesPage({ params }: Props) {
  const { slug } = await params;
  const competitor = getCompetitorBySlug(slug);

  if (!competitor) notFound();

  const faqs = generateAlternativesPageFAQs(competitor);

  // Group alternatives by category
  const offerPulseOption = { name: "OfferPulse", slug: "/", description: "Shopify-focused promotional offer monitoring", recommended: true };
  
  const promoIntelligence = [
    offerPulseOption,
    ...COMPETITORS.filter((c) => c.category === "promo-intelligence" && c.slug !== slug).map((c) => ({
      name: c.name,
      slug: `/compare/offerpulse-vs-${c.slug}`,
      description: c.positioning,
      recommended: false as const,
    })),
  ];

  const priceMonitoring = COMPETITORS.filter((c) => c.category === "price-monitoring" && c.slug !== slug).map((c) => ({
    name: c.name,
    slug: `/compare/offerpulse-vs-${c.slug}`,
    description: c.positioning,
  }));

  const websiteMonitoring = COMPETITORS.filter((c) => c.category === "website-monitoring" && c.slug !== slug).map((c) => ({
    name: c.name,
    slug: `/compare/offerpulse-vs-${c.slug}`,
    description: c.positioning,
  }));

  return (
    <div className="min-h-screen">
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50 to-white py-16 sm:py-24">
        <Container className="max-w-4xl">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Compare", href: "/compare" }, { label: `${competitor.name} Alternatives` }]} />
          <Badge className="mt-6">Alternatives</Badge>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Best {competitor.name} Alternatives (for Shopify Promo Monitoring)
          </h1>
          <p className="mt-6 text-xl text-slate-700">
            If you're evaluating {competitor.name}, here are alternatives depending on what you're trying to do.
          </p>
        </Container>
      </section>

      {/* OfferPulse First */}
      <section className="border-b border-slate-200 bg-blue-50 py-12">
        <Container className="max-w-4xl">
          <Card className="border-blue-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">OfferPulse</CardTitle>
                <Badge>Recommended</Badge>
              </div>
              <p className="text-slate-600">Shopify-focused promotional offer monitoring</p>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-slate-700">
                <strong>Best for:</strong> Shopify stores tracking competitor free shipping thresholds, bundles, gifts, and cart incentives
              </p>
              <ul className="mb-6 space-y-2 text-sm">
                <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-600" />Tracks promotional offers, not just prices</li>
                <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-600" />Free snapshot tool available</li>
                <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-600" />From £19/mo with transparent pricing</li>
              </ul>
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/free-tools/offer-snapshot/tool">Try free snapshot</Link>
              </Button>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Other Alternatives by Category */}
      <section className="py-16">
        <Container className="max-w-4xl">
          <div className="space-y-12">
            {promoIntelligence.length > 1 && (
              <div>
                <h2 className="mb-6 text-2xl font-bold text-slate-900">Promotional Intelligence Platforms</h2>
                <div className="space-y-4">
                  {promoIntelligence.filter((a) => !a.recommended).map((alt, idx) => (
                    <AlternativeCard key={idx} alternative={alt} />
                  ))}
                </div>
              </div>
            )}

            {priceMonitoring.length > 0 && (
              <div>
                <h2 className="mb-6 text-2xl font-bold text-slate-900">Price Monitoring Tools</h2>
                <div className="space-y-4">
                  {priceMonitoring.map((alt, idx) => (
                    <AlternativeCard key={idx} alternative={alt} />
                  ))}
                </div>
              </div>
            )}

            {websiteMonitoring.length > 0 && (
              <div>
                <h2 className="mb-6 text-2xl font-bold text-slate-900">Website Monitoring Tools</h2>
                <div className="space-y-4">
                  {websiteMonitoring.map((alt, idx) => (
                    <AlternativeCard key={idx} alternative={alt} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* FAQs */}
      <section className="border-t border-slate-200 bg-slate-50 py-16">
        <Container className="max-w-3xl">
          <h2 className="mb-8 text-2xl font-bold text-slate-900">Common Questions</h2>
          <Accordion type="single" collapsible>
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </section>
    </div>
  );
}

function AlternativeCard({ alternative }: { alternative: { name: string; slug: string; description: string } }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">{alternative.name}</h3>
            <p className="mt-1 text-sm text-slate-600">{alternative.description}</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href={alternative.slug}>
              Learn more
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
