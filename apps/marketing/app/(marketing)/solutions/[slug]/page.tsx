import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getSolutionBySlug, getAllSolutionSlugs } from "@/lib/seo/keyword-map";
import { getToolBySlug } from "@/lib/tools/registry";
import { getBlogPostBySlug } from "@/lib/blog/registry";
import { CANONICAL_BASE_URL } from "@/lib/seo/config";
import { CheckCircle, ArrowRight, Zap } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSolutionSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const solution = getSolutionBySlug(slug);

  if (!solution) return {};

  const url = `${CANONICAL_BASE_URL}/solutions/${slug}`;
  const ogImageUrl = `/og?title=${encodeURIComponent(solution.h1)}&subtitle=For Shopify stores`;

  return {
    title: solution.metaTitle,
    description: solution.metaDescription,
    keywords: solution.keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: solution.title,
      description: solution.metaDescription,
      url,
      type: "website",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: solution.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: solution.title,
      description: solution.metaDescription,
      images: [ogImageUrl],
    },
  };
}

export default async function SolutionPage({ params }: Props) {
  const { slug } = await params;
  const solution = getSolutionBySlug(slug);

  if (!solution) {
    notFound();
  }

  const relatedTools = solution.relatedTools
    .map((toolSlug) => getToolBySlug(toolSlug))
    .filter((t): t is NonNullable<typeof t> => t !== null);

  const relatedPosts = solution.relatedBlogPosts
    .map((postSlug) => getBlogPostBySlug(postSlug))
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: solution.title,
    description: solution.metaDescription,
    url: `${CANONICAL_BASE_URL}/solutions/${slug}`,
  };

  const faqs = getFaqsForSolution(slug);
  const faqSchema = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  } : null;

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}

      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50 to-white py-16 sm:py-24">
        <Container className="max-w-4xl">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Solutions", href: "/solutions" },
              { label: solution.title },
            ]}
          />

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {solution.h1}
          </h1>
          
          <p className="mt-6 text-xl text-slate-700 leading-relaxed">
            {getAnswerFirstContent(slug)}
          </p>

          <div className="mt-8 flex gap-4">
            <Button asChild size="lg">
              <Link href="/">Start free trial</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={`/free-tools/${relatedTools[0]?.slug || "offer-snapshot"}`}>
                Try free tool
              </Link>
            </Button>
          </div>
        </Container>
      </section>

      {/* Main Content */}
      <section className="border-b border-slate-200 py-16">
        <Container className="max-w-4xl">
          <div className="prose prose-slate max-w-none">
            {getSolutionContent(slug)}
          </div>
        </Container>
      </section>

      {/* Related Tools */}
      {relatedTools.length > 0 && (
        <section className="border-b border-slate-200 bg-slate-50 py-16">
          <Container className="max-w-4xl">
            <h2 className="mb-8 text-2xl font-bold text-slate-900">Related Free Tools</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {relatedTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Link key={tool.slug} href={`/free-tools/${tool.slug}`}>
                    <Card className="h-full transition-all hover:shadow-lg">
                      <CardHeader>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                          <Icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <CardTitle className="mt-4">{tool.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-600">{tool.shortDescription}</p>
                        <Button variant="ghost" size="sm" className="mt-4 gap-2 p-0">
                          Try free tool
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </Container>
        </section>
      )}

      {/* FAQs */}
      {faqs.length > 0 && (
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
      )}

      {/* CTA */}
      <section className="py-16">
        <Container className="max-w-3xl">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-8 text-center">
              <Zap className="mx-auto h-12 w-12 text-blue-600" />
              <h2 className="mt-4 text-2xl font-bold text-slate-900">
                Start monitoring competitor offers
              </h2>
              <p className="mt-3 text-slate-700">
                Get instant alerts when competitors change their promotions, with suggested actions
              </p>
              <Button asChild size="lg" className="mt-6">
                <Link href="/">Start free trial</Link>
              </Button>
            </CardContent>
          </Card>
        </Container>
      </section>
    </div>
  );
}

// Answer-first content (2-4 sentences, factual)
function getAnswerFirstContent(slug: string): string {
  const content: Record<string, string> = {
    "competitor-offer-monitoring":
      "Competitor offer monitoring tracks promotional changes across rival stores—discounts, bundles, free shipping thresholds, and cart incentives. Instead of manual checking, automated monitoring detects changes as they happen and alerts you with before/after details. This lets you respond strategically to competitive moves within hours, not days.",
    "shopify-competitor-monitoring":
      "Shopify competitor monitoring helps store owners track what other Shopify merchants in their category are offering. This includes promotional strategies, shipping policies, bundle deals, and cart incentives. Automated monitoring replaces manual checking and provides instant alerts when competitors change their approach.",
    "free-shipping-threshold-monitoring":
      "Free shipping threshold monitoring tracks the minimum order value competitors require for free delivery. When a competitor drops their threshold from £75 to £50, that signals a strategic shift worth responding to. Automated tracking ensures you don't miss these changes between manual checks.",
    "discount-code-monitoring":
      "Discount code monitoring tracks promotional codes and percentage discounts competitors are actively advertising. This includes sitewide sales, category-specific discounts, and new customer offers. Knowing when competitors launch or end discount campaigns helps you time your own promotional calendar.",
    "bundle-offer-monitoring":
      "Bundle offer monitoring detects when competitors introduce multi-buy deals (Buy 2 Get 1 Free, Buy 3 for £X, product pairing). Bundle offers often signal a shift from percentage discounting to margin-preserving promotional strategies. Tracking these helps you decide when to match or counter with your own bundles.",
    "cart-incentive-monitoring":
      "Cart incentive monitoring tracks progress bars, unlock thresholds ('£15 away from free gift'), and gift-with-purchase offers that competitors use to increase average order value. These tactics are harder to spot than banner promotions, but they directly impact conversion and AOV.",
  };

  return content[slug] || "Monitor competitor promotional strategies automatically and get alerted when anything changes.";
}

// Main solution content
function getSolutionContent(slug: string) {
  // This would ideally come from a CMS or markdown files
  // For now, returning structured JSX
  return (
    <div>
      <h2>How It Works</h2>
      <ol>
        <li>Add your competitors' store URLs to OfferPulse</li>
        <li>We check their offers on your chosen schedule (hourly, daily, or weekly)</li>
        <li>When we detect a change, you get an instant alert with before/after details</li>
        <li>Review the suggested response: match, counter, or ignore</li>
      </ol>

      <h2>Why Automated Monitoring Matters</h2>
      <p>
        Manual competitor checking doesn't scale. If you check five competitors once a week, you miss changes that happen between checks. A competitor might launch a flash sale on Tuesday, and if you check on Friday, you've already lost three days of potential response time.
      </p>
      <p>
        Automated monitoring solves this by checking on a schedule you set and alerting you immediately when something changes. You react in hours, not days.
      </p>

      <h2>What You Can Track</h2>
      <ul>
        <li><strong>Promotional discounts:</strong> percentage off, fixed amount, promotional codes</li>
        <li><strong>Free shipping:</strong> threshold changes, delivery speed offers</li>
        <li><strong>Bundle offers:</strong> BOGO, multi-buy, product pairing</li>
        <li><strong>Cart incentives:</strong> progress bars, unlock thresholds, gifts</li>
      </ul>
    </div>
  );
}

// FAQs specific to each solution
function getFaqsForSolution(slug: string) {
  const faqMap: Record<string, Array<{ question: string; answer: string }>> = {
    "competitor-offer-monitoring": [
      {
        question: "How often does OfferPulse check competitors?",
        answer:
          "You choose the frequency: hourly (for fast-moving categories), every 6 hours, or daily. Most stores use daily checks, which balances coverage with reasonable alert volume.",
      },
      {
        question: "What happens when a change is detected?",
        answer:
          "You receive an alert (email or Slack) showing the before/after details, which competitor made the change, and our suggested response (match, counter, or ignore based on your positioning).",
      },
      {
        question: "Can I track competitors on different platforms?",
        answer:
          "Yes. OfferPulse works with Shopify, WooCommerce, Magento, and most ecommerce platforms since we track publicly visible promotional content.",
      },
    ],
    "shopify-competitor-monitoring": [
      {
        question: "Does this only work for Shopify stores?",
        answer:
          "No. While we're built for Shopify merchants, OfferPulse can track competitors on any ecommerce platform (WooCommerce, Magento, custom). We track publicly visible promotional content regardless of platform.",
      },
      {
        question: "How many competitors can I track?",
        answer:
          "Plans start at 5 competitors (Starter) up to 20 (Pro) or unlimited (Enterprise). We recommend tracking 3-5 direct competitors to keep signal high and noise low.",
      },
    ],
    // Add more as needed
  };

  return faqMap[slug] || [];
}
