import { notFound } from "next/testing";
import Link from "next/link";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getCompetitorBySlug, getAllCompetitorSlugs } from "@/lib/compare/competitors";
import { generateReviewPageFAQs } from "@/lib/compare/helpers";
import { CANONICAL_BASE_URL } from "@/lib/seo/config";
import { CheckCircle, X } from "lucide-react";
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
    title: `${competitor.name} Review (2026): Features, Pros & Cons, Alternatives`,
    description: `${competitor.name} review covering key features, pros and cons, pricing, and when it's the right fit vs alternatives like OfferPulse for Shopify promo monitoring.`,
    keywords: [`${competitor.slug} review`, `is ${competitor.name} good`, `${competitor.name} pros and cons`],
    alternates: { canonical: `/compare/${slug}-review` },
  };
}

export default async function ReviewPage({ params }: Props) {
  const { slug } = await params;
  const competitor = getCompetitorBySlug(slug);

  if (!competitor) notFound();

  const faqs = generateReviewPageFAQs(competitor);

  return (
    <div className="min-h-screen">
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50 to-white py-16 sm:py-24">
        <Container className="max-w-4xl">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Compare", href: "/compare" }, { label: `${competitor.name} Review` }]} />
          <Badge className="mt-6">Review</Badge>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {competitor.name} Review: What It's Good For (and When OfferPulse Is a Better Fit)
          </h1>
          <p className="mt-6 text-xl text-slate-700">{competitor.positioning}</p>
        </Container>
      </section>

      {/* What It Is */}
      <section className="border-b border-slate-200 py-16">
        <Container className="max-w-4xl">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">What {competitor.name} Is</h2>
          <p className="text-lg text-slate-700 leading-relaxed">
            {competitor.name} is a {competitor.positioning.toLowerCase()} designed for {competitor.audience.toLowerCase()}. {competitor.pricingModel}.
          </p>
        </Container>
      </section>

      {/* Key Features */}
      <section className="border-b border-slate-200 bg-slate-50 py-16">
        <Container className="max-w-4xl">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">Key Features</h2>
          <ul className="space-y-3">
            {competitor.strengths.map((strength, idx) => (
              <li key={idx} className="flex gap-3">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
                <span className="text-slate-700">{strength}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Pros & Cons */}
      <section className="border-b border-slate-200 py-16">
        <Container className="max-w-4xl">
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <h3 className="mb-4 text-xl font-bold text-slate-900">Pros</h3>
                <ul className="space-y-2">
                  {competitor.strengths.slice(0, 4).map((pro, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-slate-700">
                      <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
                      {pro}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <h3 className="mb-4 text-xl font-bold text-slate-900">Cons</h3>
                <ul className="space-y-2">
                  {competitor.limitations.map((con, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-slate-700">
                      <X className="h-4 w-4 flex-shrink-0 text-red-600" />
                      {con}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* Best Fit Scenarios */}
      <section className="border-b border-slate-200 bg-slate-50 py-16">
        <Container className="max-w-4xl">
          <div className="space-y-8">
            <div>
              <h2 className="mb-4 text-2xl font-bold text-slate-900">Best Fit Scenarios</h2>
              <ul className="space-y-2">
                {competitor.bestFor.map((scenario, idx) => (
                  <li key={idx} className="flex gap-3">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
                    <span className="text-slate-700">{scenario}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-xl font-bold text-slate-900">Not Ideal If...</h3>
              <ul className="space-y-2">
                {competitor.notIdealFor.map((scenario, idx) => (
                  <li key={idx} className="flex gap-3">
                    <X className="h-5 w-5 flex-shrink-0 text-slate-400" />
                    <span className="text-slate-700">{scenario}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* OfferPulse Comparison Summary */}
      <section className="border-b border-slate-200 py-16">
        <Container className="max-w-4xl">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">OfferPulse Comparison Summary</h2>
          <p className="mb-6 text-slate-700 leading-relaxed">
            While {competitor.name} {getCompetitorStrength(competitor)}, OfferPulse specializes in promotional offer intelligence for Shopify stores. We track free shipping thresholds, bundle offers, gifts, and cart incentives—the mechanics that drive conversion and AOV decisions.
          </p>
          <Button asChild size="lg">
            <Link href="/free-tools/offer-snapshot/tool">Try OfferPulse free</Link>
          </Button>
        </Container>
      </section>

      {/* FAQs */}
      <section className="border-b border-slate-200 bg-slate-50 py-16">
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

      {/* Sources */}
      <section className="py-12">
        <Container className="max-w-3xl">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Sources</h3>
          <div className="flex flex-wrap gap-3">
            {competitor.sourceUrls.map((source, idx) => (
              <a key={idx} href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                {source.label}
              </a>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">Last updated: {competitor.lastUpdated}</p>
        </Container>
      </section>
    </div>
  );
}

function getCompetitorStrength(competitor: typeof COMPETITORS[0]): string {
  if (competitor.category === "promo-intelligence") return "excels at enterprise market intelligence";
  if (competitor.category === "price-monitoring") return "focuses on price-level tracking";
  return "provides general website change detection";
}

import { COMPETITORS } from "@/lib/compare/competitors";
