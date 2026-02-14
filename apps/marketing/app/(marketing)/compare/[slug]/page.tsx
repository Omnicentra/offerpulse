import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getCompetitorBySlug, getAllCompetitorSlugs, COMPETITORS } from "@/lib/compare/competitors";
import { generateAlternativesPageFAQs, generateReviewPageFAQs, generateVsPageFAQs, getCategoryDescription } from "@/lib/compare/helpers";
import { CANONICAL_BASE_URL } from "@/lib/seo/config";
import { CheckCircle, X, ArrowRight, Sparkles } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

type PageType = "alternatives" | "review" | "vs";

interface ParsedSlug {
  type: PageType;
  competitorSlug: string;
}

function parseSlug(slug: string): ParsedSlug | null {
  // Check for alternatives pattern: {slug}-alternatives
  if (slug.endsWith("-alternatives")) {
    const competitorSlug = slug.replace("-alternatives", "");
    return { type: "alternatives", competitorSlug };
  }

  // Check for review pattern: {slug}-review
  if (slug.endsWith("-review")) {
    const competitorSlug = slug.replace("-review", "");
    return { type: "review", competitorSlug };
  }

  // Check for vs pattern: offerpulse-vs-{slug}
  if (slug.startsWith("offerpulse-vs-")) {
    const competitorSlug = slug.replace("offerpulse-vs-", "");
    return { type: "vs", competitorSlug };
  }

  return null;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = getAllCompetitorSlugs();
  const params: { slug: string }[] = [];

  slugs.forEach((competitorSlug) => {
    params.push(
      { slug: `${competitorSlug}-alternatives` },
      { slug: `${competitorSlug}-review` },
      { slug: `offerpulse-vs-${competitorSlug}` }
    );
  });

  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseSlug(slug);

  if (!parsed) return {};

  const competitor = getCompetitorBySlug(parsed.competitorSlug);
  if (!competitor) return {};

  switch (parsed.type) {
    case "alternatives":
      return {
        title: `Best ${competitor.name} Alternatives for Shopify Promo Monitoring (2026)`,
        description: `Looking for ${competitor.name} alternatives? Compare OfferPulse and other tools for tracking competitor offers, bundles, and shipping thresholds on Shopify.`,
        keywords: [`${competitor.slug} alternatives`, `${competitor.name} competitors`, "promotional monitoring alternatives"],
        alternates: { canonical: `/compare/${slug}` },
      };

    case "review":
      return {
        title: `${competitor.name} Review (2026): Features, Pros & Cons, Alternatives`,
        description: `${competitor.name} review covering key features, pros and cons, pricing, and when it's the right fit vs alternatives like OfferPulse for Shopify promo monitoring.`,
        keywords: [`${competitor.slug} review`, `is ${competitor.name} good`, `${competitor.name} pros and cons`],
        alternates: { canonical: `/compare/${slug}` },
      };

    case "vs":
      return {
        title: `OfferPulse vs ${competitor.name}: Promo Monitoring vs ${getCategoryDescription(competitor.category)} | 2026`,
        description: `Compare OfferPulse and ${competitor.name}. OfferPulse tracks promotional offers (bundles, shipping thresholds, cart incentives) while ${competitor.name} ${getCompetitorFocusDescription(competitor)}. See which fits your needs.`,
        keywords: [`offerpulse vs ${competitor.slug}`, `${competitor.name} alternative`, "competitor monitoring comparison"],
        alternates: { canonical: `/compare/${slug}` },
        openGraph: {
          title: `OfferPulse vs ${competitor.name}`,
          description: `Compare offer intelligence vs ${getCategoryDescription(competitor.category)} for Shopify stores.`,
          url: `${CANONICAL_BASE_URL}/compare/${slug}`,
        },
      };
  }
}

export default async function ComparePage({ params }: Props) {
  const { slug } = await params;
  const parsed = parseSlug(slug);

  if (!parsed) {
    notFound();
  }

  const competitor = getCompetitorBySlug(parsed.competitorSlug);
  if (!competitor) {
    notFound();
  }

  switch (parsed.type) {
    case "alternatives":
      return <AlternativesPage competitor={competitor} />;
    case "review":
      return <ReviewPage competitor={competitor} />;
    case "vs":
      return <VsPage competitor={competitor} />;
  }
}

// ============================================================================
// ALTERNATIVES PAGE
// ============================================================================

function AlternativesPage({ competitor }: { competitor: typeof COMPETITORS[0] }) {
  const faqs = generateAlternativesPageFAQs(competitor);

  // Group alternatives by category
  const offerPulseOption = { name: "OfferPulse", slug: "/", description: "Shopify-focused promotional offer monitoring", recommended: true };
  
  const promoIntelligence = [
    offerPulseOption,
    ...COMPETITORS.filter((c) => c.category === "promo-intelligence" && c.slug !== competitor.slug).map((c) => ({
      name: c.name,
      slug: `/compare/offerpulse-vs-${c.slug}`,
      description: c.positioning,
      recommended: false as const,
    })),
  ];

  const priceMonitoring = COMPETITORS.filter((c) => c.category === "price-monitoring" && c.slug !== competitor.slug).map((c) => ({
    name: c.name,
    slug: `/compare/offerpulse-vs-${c.slug}`,
    description: c.positioning,
  }));

  const websiteMonitoring = COMPETITORS.filter((c) => c.category === "website-monitoring" && c.slug !== competitor.slug).map((c) => ({
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

// ============================================================================
// REVIEW PAGE
// ============================================================================

function ReviewPage({ competitor }: { competitor: typeof COMPETITORS[0] }) {
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

// ============================================================================
// VS PAGE
// ============================================================================

function VsPage({ competitor }: { competitor: typeof COMPETITORS[0] }) {
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

// ============================================================================
// HELPER COMPONENTS & FUNCTIONS
// ============================================================================

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

function getCompetitorStrength(competitor: typeof COMPETITORS[0]): string {
  if (competitor.category === "promo-intelligence") return "excels at enterprise market intelligence";
  if (competitor.category === "price-monitoring") return "focuses on price-level tracking";
  return "provides general website change detection";
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
