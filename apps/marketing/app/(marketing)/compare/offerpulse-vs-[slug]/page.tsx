import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getCompetitorBySlug, getAllCompetitorSlugs } from "@/lib/compare/competitors";
import { generateVsPageFAQs, getCategoryDescription } from "@/lib/compare/helpers";
import { CANONICAL_BASE_URL } from "@/lib/seo/config";
import { CheckCircle, X, Sparkles } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false; // Only allow pre-generated paths

export async function generateStaticParams() {
  return getAllCompetitorSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const competitor = getCompetitorBySlug(slug);

  if (!competitor) return {};

  return {
    title: `OfferPulse vs ${competitor.name}: Promo Monitoring vs ${getCategoryDescription(competitor.category)} | 2026`,
    description: `Compare OfferPulse and ${competitor.name}. OfferPulse tracks promotional offers (bundles, shipping thresholds, cart incentives) while ${competitor.name} ${getCompetitorFocusDescription(competitor)}. See which fits your needs.`,
    keywords: [`offerpulse vs ${competitor.slug}`, `${competitor.name} alternative`, "competitor monitoring comparison"],
    alternates: { canonical: `/compare/offerpulse-vs-${slug}` },
    openGraph: {
      title: `OfferPulse vs ${competitor.name}`,
      description: `Compare offer intelligence vs ${getCategoryDescription(competitor.category)} for Shopify stores.`,
      url: `${CANONICAL_BASE_URL}/compare/offerpulse-vs-${slug}`,
    },
  };
}

export default async function VsPage({ params }: Props) {
  const { slug } = await params;
  const competitor = getCompetitorBySlug(slug);

  if (!competitor) notFound();

  const faqs = generateVsPageFAQs(competitor);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50 to-white py-16 sm:py-24">
        <Container className="max-w-4xl">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Compare", href: "/compare" }, { label: `OfferPulse vs ${competitor.name}` }]} />
          <Badge className="mt-6">Comparison</Badge>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            OfferPulse vs {competitor.name}
          </h1>
          <p className="mt-6 text-xl text-slate-700">
            Comparing promotional offer intelligence (OfferPulse) with {getCategoryDescription(competitor.category)} ({competitor.name})
          </p>
          <div className="mt-8 flex gap-4">
            <Button asChild size="lg"><Link href="/free-tools/offer-snapshot/tool">Try OfferPulse free</Link></Button>
            <Button asChild variant="outline" size="lg"><Link href="/pricing">See pricing</Link></Button>
          </div>
        </Container>
      </section>

      {/* Feature Comparison Table */}
      <section className="border-b border-slate-200 py-16">
        <Container className="max-w-5xl">
          <h2 className="mb-8 text-3xl font-bold text-slate-900">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Feature</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">OfferPulse</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">{competitor.name}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {getComparisonFeatures(competitor).map((row, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 font-medium text-slate-900">{row.feature}</td>
                    <td className="px-6 py-4">{row.offerpulse ? <CheckCircle className="h-5 w-5 text-green-600" /> : <X className="h-5 w-5 text-slate-300" />}</td>
                    <td className="px-6 py-4">{row.competitor ? <CheckCircle className="h-5 w-5 text-green-600" /> : <X className="h-5 w-5 text-slate-300" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      {/* When to Choose */}
      <section className="border-b border-slate-200 bg-slate-50 py-16">
        <Container className="max-w-4xl">
          <div className="grid gap-8 md:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-4 text-xl font-bold text-slate-900">When to choose {competitor.name}</h3>
                <ul className="space-y-3">
                  {competitor.bestFor.map((item, idx) => (
                    <li key={idx} className="flex gap-3">
                      <CheckCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="ring-2 ring-blue-600">
              <CardContent className="p-6">
                <h3 className="mb-4 text-xl font-bold text-slate-900">When to choose OfferPulse</h3>
                <ul className="space-y-3">
                  {getOfferPulseAdvantages(competitor).map((item, idx) => (
                    <li key={idx} className="flex gap-3">
                      <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* FAQs */}
      <section className="border-b border-slate-200 py-16">
        <Container className="max-w-3xl">
          <h2 className="mb-8 text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible>
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-slate-700">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </section>

      {/* Sources */}
      <section className="border-b border-slate-200 bg-slate-50 py-12">
        <Container className="max-w-3xl">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Sources</h3>
          <div className="flex flex-wrap gap-3">
            {competitor.sourceUrls.map((source, idx) => (
              <a
                key={idx}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                {source.label}
              </a>
            ))}
            <Link href="/" className="text-sm text-blue-600 hover:underline">
              OfferPulse Official Site
            </Link>
          </div>
          <p className="mt-3 text-xs text-slate-500">Last updated: {competitor.lastUpdated}</p>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-16">
        <Container className="max-w-3xl">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-8 text-center">
              <Sparkles className="mx-auto h-12 w-12 text-blue-600" />
              <h2 className="mt-4 text-2xl font-bold text-slate-900">Try OfferPulse Free</h2>
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

function getCompetitorFocusDescription(competitor: typeof COMPETITORS[0]): string {
  if (competitor.category === "promo-intelligence") return "provides broader market intelligence for enterprise teams";
  if (competitor.category === "price-monitoring") return "focuses on product-level price changes";
  return "monitors general webpage changes";
}

function getComparisonFeatures(competitor: typeof COMPETITORS[0]) {
  const baseFeatures = [
    { feature: "Free shipping threshold tracking", offerpulse: true, competitor: competitor.category === "promo-intelligence" },
    { feature: "Bundle offer detection", offerpulse: true, competitor: competitor.category === "promo-intelligence" },
    { feature: "Cart incentive tracking", offerpulse: true, competitor: false },
    { feature: "Gift with purchase detection", offerpulse: true, competitor: competitor.category === "promo-intelligence" },
    { feature: "Discount code extraction", offerpulse: true, competitor: true },
    { feature: "Product price tracking", offerpulse: false, competitor: competitor.category === "price-monitoring" },
    { feature: "Shopify-focused", offerpulse: true, competitor: competitor.slug === "prisync" },
    { feature: "Self-serve setup", offerpulse: true, competitor: !competitor.pricingModel.includes("Enterprise") },
    { feature: "Transparent pricing", offerpulse: true, competitor: !competitor.pricingModel.includes("custom") },
  ];

  return baseFeatures;
}

function getOfferPulseAdvantages(competitor: typeof COMPETITORS[0]) {
  const base = [
    "Tracks promotional offers, not just prices",
    "Detects free shipping threshold changes",
    "Monitors bundle and gift offers",
    "Tracks cart progress incentives",
    "Built specifically for Shopify stores",
    "Transparent pricing from £19/mo",
    "Self-serve setup in minutes",
  ];

  if (competitor.category === "website-monitoring") {
    base.push("Provides offer context, not just 'something changed'");
  }

  return base;
}

// Import COMPETITORS type
import { COMPETITORS } from "@/lib/compare/competitors";
