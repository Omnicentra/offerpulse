import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { SignupCtaButton } from "@/components/signup-cta-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CANONICAL_BASE_URL, ORGANIZATION } from "@/lib/seo/config";
import { CheckCircle, ArrowRight, Package, Percent, Truck, ShoppingCart, Gift, Code, Target } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing Intelligence vs Offer Intelligence: What's the Difference? | OfferPulse",
  description:
    "Learn the critical difference between tracking competitor prices and tracking their promotional offers. Why offer intelligence (discounts, bundles, shipping) drives more strategic decisions than price monitoring alone.",
  keywords: [
    "pricing intelligence",
    "offer intelligence",
    "promotional intelligence",
    "competitor monitoring",
    "price monitoring vs offer monitoring",
    "ecommerce competitive intelligence",
  ],
  alternates: {
    canonical: "/guides/pricing-intelligence-vs-offer-intelligence",
  },
  openGraph: {
    title: "Pricing Intelligence vs Offer Intelligence: The Key Difference",
    description: "Why tracking competitor offers (not just prices) drives better strategic decisions for Shopify stores.",
    url: `${CANONICAL_BASE_URL}/guides/pricing-intelligence-vs-offer-intelligence`,
    type: "article",
    images: [{ url: "/og/og-default.png", width: 1200, height: 630, alt: "Pricing vs Offer Intelligence" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing Intelligence vs Offer Intelligence",
    description: "Why offer tracking beats price tracking for most ecommerce stores",
    images: ["/og/og-default.png"],
  },
};

export default function GuidePage() {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Pricing Intelligence vs Offer Intelligence: What's the Difference?",
    description:
      "Comprehensive guide explaining the difference between pricing intelligence and offer intelligence for ecommerce stores.",
    author: { "@type": "Organization", name: "OfferPulse" },
    publisher: {
      "@type": "Organization",
      name: ORGANIZATION.name,
      logo: { "@type": "ImageObject", url: ORGANIZATION.logo },
    },
    datePublished: "2026-02-01",
    dateModified: "2026-02-10",
    url: `${CANONICAL_BASE_URL}/guides/pricing-intelligence-vs-offer-intelligence`,
  };

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
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50 to-white py-16 sm:py-24">
        <Container className="max-w-4xl">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Guides", href: "/blog" }, { label: "Pricing vs Offer Intelligence" }]} />

          <Badge className="mt-6">Strategy Guide</Badge>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Pricing Intelligence vs Offer Intelligence
          </h1>
          <p className="mt-6 text-xl text-slate-700 leading-relaxed">
            Most ecommerce tools track competitor prices. That's pricing intelligence. But pricing changes are noisy and rarely strategic. Offer intelligence—tracking discounts, bundles, free shipping thresholds, and cart incentives—gives you the signals that actually matter for conversion and margin decisions.
          </p>

          <div className="mt-8 flex gap-4">
            <Button asChild size="lg">
              <Link href="/free-tools/offer-snapshot/tool">Generate free snapshot</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>
        </Container>
      </section>

      {/* Comparison Table */}
      <section className="border-b border-slate-200 py-16 sm:py-20">
        <Container className="max-w-5xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-slate-900">The Key Difference</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Aspect</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Pricing Intelligence</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Offer Intelligence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {[
                  {
                    aspect: "What it tracks",
                    pricing: "Product-level prices (£19.99, £24.99)",
                    offer: "Promotional structures (20% off, free shipping over £50, Buy 2 Get 1)",
                  },
                  {
                    aspect: "Signal stability",
                    pricing: "Changes frequently, often temporarily",
                    offer: "Changes less often, usually strategic",
                  },
                  {
                    aspect: "Decision impact",
                    pricing: "Should I match this product price?",
                    offer: "Should I match their shipping threshold or counter with a bundle?",
                  },
                  {
                    aspect: "Use case",
                    pricing: "Commodity categories, price-sensitive markets",
                    offer: "Branded products, promotional strategy, conversion optimisation",
                  },
                  {
                    aspect: "Action required",
                    pricing: "React to individual price changes",
                    offer: "Make strategic promotional decisions",
                  },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{row.aspect}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{row.pricing}</td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-medium">{row.offer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      {/* Why Pricing Intelligence Isn't Enough */}
      <section className="border-b border-slate-200 bg-slate-50 py-16 sm:py-20">
        <Container className="max-w-4xl">
          <h2 className="mb-8 text-3xl font-bold text-slate-900">Why Pricing Intelligence Isn't Enough</h2>
          
          <div className="space-y-8 text-lg text-slate-700">
            <p className="leading-relaxed">
              Pricing intelligence tools tell you when a competitor drops their product price from £25 to £22. That's useful if you're selling commodities where price is the primary decision factor. But for most Shopify stores selling branded or differentiated products, this isn't the signal you need.
            </p>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="font-semibold text-slate-900 mb-2">Example:</p>
              <p className="text-slate-700">
                Your competitor's product price drops £3. Do you match? It depends on context you don't have: Is this a permanent repricing or part of a "20% off sitewide" promotion? If it's a promotion, when does it end? What else are they offering (free shipping, bundles)?
              </p>
            </div>

            <p className="leading-relaxed">
              Price changes without promotional context lead to reactive, margin-eroding decisions. You match a price drop without knowing it's temporary. You don't realize their "lower price" is paired with a £75 free shipping threshold while you offer £50, giving you the real competitive advantage.
            </p>

            <p className="leading-relaxed">
              Offer intelligence solves this by tracking the promotional structure, not just the end price. You see "20% off sitewide" (the offer) plus "free shipping over £50" (the threshold) plus "Buy 2 get 10% extra off" (the bundle). Now you have the full competitive picture.
            </p>
          </div>
        </Container>
      </section>

      {/* What Offer Intelligence Tracks */}
      <section className="border-b border-slate-200 py-16 sm:py-20">
        <Container className="max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">What Offer Intelligence Tracks</h2>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Percent,
                title: "Discounts & Codes",
                description: "Percentage off, fixed amount discounts, promotional codes, sitewide vs category sales",
                example: "20% OFF SITEWIDE • Code: SAVE20",
              },
              {
                icon: Code,
                title: "Promotional Codes",
                description: "Active promo codes, first-order discounts, exclusive codes, code positioning",
                example: "WELCOME10 • NEW15 • FLASH25",
              },
              {
                icon: Truck,
                title: "Shipping Thresholds",
                description: "Free shipping requirements, delivery speed offers, threshold changes",
                example: "Free shipping on orders over £50",
              },
              {
                icon: Package,
                title: "Bundle Offers",
                description: "BOGO deals, multi-buy promotions, product pairing, bundle discounts",
                example: "Buy 2 Get 1 Free • 3 for £60",
              },
              {
                icon: Gift,
                title: "Gifts with Purchase",
                description: "Free gift thresholds, GWP offers, sample offers, bonus items",
                example: "Free gift with orders over £75",
              },
              {
                icon: ShoppingCart,
                title: "Cart Incentives",
                description: "Progress bars, unlock messaging, cart thresholds, urgency tactics",
                example: "£15 away from free shipping",
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <Card key={idx} className="relative">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="mt-4 text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-700 leading-relaxed">{item.description}</p>
                    <div className="mt-4 rounded-lg bg-blue-50 px-3 py-2">
                      <p className="text-xs font-mono text-blue-800">{item.example}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <p className="text-slate-600">
              Want to see what offers a competitor is running right now?
            </p>
            <Button asChild className="mt-4">
              <Link href="/free-tools/offer-snapshot/tool">Generate free snapshot</Link>
            </Button>
          </div>
        </Container>
      </section>

      {/* Benefits & Outcomes */}
      <section className="border-b border-slate-200 bg-slate-50 py-16 sm:py-20">
        <Container className="max-w-4xl">
          <h2 className="mb-8 text-3xl font-bold text-slate-900">Benefits & Outcomes</h2>
          
          <div className="space-y-6">
            {[
              {
                metric: "Protect Conversion Rate",
                description:
                  "When a competitor drops their free shipping threshold from £75 to £50 and you don't know, customers comparison shop and choose them. Offer intelligence lets you respond before conversion drops.",
              },
              {
                metric: "Optimise AOV",
                description:
                  "Tracking competitor cart incentives (progress bars, unlock thresholds, gifts) helps you benchmark and improve your own AOV tactics without guessing.",
              },
              {
                metric: "Protect Margin",
                description:
                  "Instead of blindly matching percentage discounts, you see the full offer structure and can counter with bundles or threshold changes that protect margin while staying competitive.",
              },
            ].map((benefit, idx) => (
              <div key={idx} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-6">
                <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-600" />
                <div>
                  <h3 className="font-semibold text-slate-900">{benefit.metric}</h3>
                  <p className="mt-2 text-slate-700 leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* How OfferPulse Works */}
      <section className="border-b border-slate-200 py-16 sm:py-20">
        <Container className="max-w-4xl">
          <h2 className="mb-12 text-3xl font-bold text-slate-900 text-center">How OfferPulse Works</h2>
          
          <div className="space-y-8">
            {[
              {
                step: "1",
                title: "Add Competitor URLs",
                description: "Enter the store URLs of 3-5 direct competitors you want to monitor.",
              },
              {
                step: "2",
                title: "Set Check Frequency",
                description: "Choose how often to check: hourly, every 6 hours, or daily based on how fast your category moves.",
              },
              {
                step: "3",
                title: "We Extract Offers",
                description: "OfferPulse scans homepage, banners, and key pages for promotional content: discounts, codes, shipping thresholds, bundles, gifts, cart incentives.",
              },
              {
                step: "4",
                title: "Get Instant Alerts",
                description: "When we detect a change, you get an alert (email or Slack) with before/after details and the specific offer that changed.",
              },
              {
                step: "5",
                title: "Respond Strategically",
                description: "Review the suggested response (match, counter, or ignore) and decide your action based on positioning and margin impact.",
              },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-6">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                  {item.step}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-slate-700 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-xl border border-blue-200 bg-blue-50 p-8 text-center">
            <p className="text-slate-900 font-semibold mb-2">Try it free right now</p>
            <p className="text-sm text-slate-700 mb-6">
              Generate a free snapshot of any competitor to see what offers they're currently running
            </p>
            <Button asChild size="lg">
              <Link href="/free-tools/offer-snapshot/tool">Generate free snapshot</Link>
            </Button>
          </div>
        </Container>
      </section>

      {/* Who This Is For */}
      <section className="border-b border-slate-200 bg-slate-50 py-16 sm:py-20">
        <Container className="max-w-4xl">
          <h2 className="mb-8 text-3xl font-bold text-slate-900">Who This Is For</h2>
          
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "Shopify Store Owners",
                description: "Founders and operators who need to stay competitive without spending hours manually checking competitor websites.",
              },
              {
                title: "Ecommerce Marketers",
                description: "Growth and marketing managers responsible for promotional strategy and conversion optimization.",
              },
              {
                title: "Agencies",
                description: "Teams managing multiple client stores who need efficient competitive intelligence workflows.",
              },
            ].map((audience, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <Target className="h-8 w-8 text-blue-600" />
                  <CardTitle className="mt-4">{audience.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700 leading-relaxed">{audience.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQs */}
      <section className="border-b border-slate-200 py-16 sm:py-20">
        <Container className="max-w-3xl">
          <h2 className="mb-8 text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible>
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`}>
                <AccordionTrigger className="text-left font-semibold">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-slate-700 leading-relaxed">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </section>

      {/* Related Content */}
      <section className="border-b border-slate-200 bg-slate-50 py-16">
        <Container className="max-w-4xl">
          <h2 className="mb-8 text-2xl font-bold text-slate-900">Related Content</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { title: "How to Monitor Promos", href: "/blog/monitor-competitor-promos-without-spreadsheets" },
              { title: "Free Shipping Benchmarks", href: "/blog/free-shipping-thresholds-shopify-benchmarks" },
              { title: "Bundles vs Discounts", href: "/blog/bundles-vs-discounts-protecting-margin" },
            ].map((link, idx) => (
              <Link key={idx} href={link.href}>
                <Card className="h-full transition-all hover:shadow-lg">
                  <CardContent className="p-6">
                    <p className="font-semibold text-slate-900">{link.title}</p>
                    <Button variant="ghost" size="sm" className="mt-4 gap-2 p-0">
                      Read article
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-20">
        <Container className="max-w-3xl">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-8 sm:p-12 text-center">
              <h2 className="text-3xl font-bold text-slate-900">
                Start tracking competitor offers
              </h2>
              <p className="mt-4 text-lg text-slate-700">
                Get instant alerts when competitors change their discounts, bundles, shipping, or cart incentives—with suggested strategic responses.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <SignupCtaButton size="lg" source="guides_pricing_vs_offer">
                  Start free trial
                </SignupCtaButton>
                <Button asChild variant="outline" size="lg">
                  <Link href="/free-tools">Try free tools</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>
    </div>
  );
}

const faqs = [
  {
    question: "Do I need both pricing intelligence and offer intelligence?",
    answer:
      "It depends on your category. If you sell commoditized products where price is the primary decision factor (electronics accessories, basic consumables), pricing intelligence matters. If you sell branded or differentiated products where value proposition and promotions drive decisions, offer intelligence is more valuable. Most stores benefit more from offer intelligence.",
  },
  {
    question: "How is offer intelligence different from price monitoring?",
    answer:
      "Price monitoring tracks individual product prices (£19.99 → £17.99). Offer intelligence tracks promotional structures: 20% off sitewide, free shipping over £50, Buy 2 Get 1 Free, gift with purchase. Offers drive broader strategic decisions, while price changes are often tactical and temporary.",
  },
  {
    question: "Can't I just check competitor websites manually?",
    answer:
      "You can, but manual checking doesn't scale and misses changes between checks. If you check weekly and a competitor launches a 48-hour flash sale on Tuesday, you won't see it until Friday—too late to respond. Automated offer monitoring catches changes as they happen.",
  },
  {
    question: "What if my competitors don't run many promotions?",
    answer:
      "Even stores that don't run frequent sales still have offer structures: free shipping thresholds, cart progress incentives, bundle recommendations, gift-with-purchase. These are always-on offers worth tracking. And when they do launch a promotion, you want to know immediately.",
  },
  {
    question: "How often should offers be checked?",
    answer:
      "For most categories, daily checks provide good coverage. Fast-moving categories (fashion during sales, electronics during launch periods) benefit from hourly or 6-hour checks. Slower categories can use weekly checks. The key is consistency.",
  },
  {
    question: "Should I match every competitor offer?",
    answer:
      "No. Matching every offer erodes margin and positions you as a follower. Use a framework: match when necessary for defensive positioning (e.g., competitor undercuts on shipping threshold), counter with different offer types when possible (bundle vs discount), and ignore when it doesn't affect your core segment.",
  },
  {
    question: "Does offer intelligence work for B2B or only B2C?",
    answer:
      "Offer intelligence works for both. B2B ecommerce uses offers differently (volume discounts, tiered pricing, white-glove delivery) but the principle is the same: tracking how competitors structure value beyond base price helps you make strategic decisions.",
  },
  {
    question: "How do I get started with offer intelligence?",
    answer:
      "Start by using the free competitor offer snapshot tool to see what offers your top 3 competitors are currently running. This gives you a baseline. Then decide if manual weekly checks are sufficient or if automated monitoring (OfferPulse) makes sense for your needs.",
  },
];
