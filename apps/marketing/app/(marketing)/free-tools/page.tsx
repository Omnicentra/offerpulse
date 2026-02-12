import Link from "next/link";
import { Container } from "@/components/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { tools, generateToolListSchema } from "@/lib/tools/registry";

export const metadata = {
  title: "Free Competitor Offer Tracking Tools | OfferPulse",
  description:
    "Free tools to analyse competitor offers, shipping thresholds, discounts, bundles, and cart incentives. Instant insights for Shopify and ecommerce stores.",
  alternates: {
    canonical: "/free-tools",
  },
  openGraph: {
    title: "Free Competitor Offer Tracking Tools",
    description: "Analyse competitor offers, shipping thresholds, and discounts instantly. Free tools for Shopify merchants.",
    url: "https://www.offerpulse.io/free-tools",
    images: [
      {
        url: "/og/og-default.png",
        width: 1200,
        height: 630,
        alt: "OfferPulse Free Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Competitor Offer Tracking Tools",
    description: "Analyse competitor offers instantly. Free tools for Shopify merchants.",
    images: ["/og/og-default.png"],
  },
};

export default function FreeToolsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_MARKETING_APP_URL || "https://offerpulse.com";
  const schema = generateToolListSchema(tools, `${baseUrl}/free-tools`);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <Container className="py-16 sm:py-24">
        {/* Hero */}
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-6">
            Free Tools
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Free Competitor Offer Tracking Tools for Shopify
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-600 sm:text-xl">
            Analyse competitor offers, shipping thresholds, discounts, and cart incentives instantly. Perfect for Shopify store owners and ecommerce agencies who need quick competitive intelligence.
          </p>
        </div>

        {/* Introduction Content for SEO */}
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="prose prose-slate max-w-none">
            <h2 className="text-2xl font-bold text-slate-900">
              What Are These Free Tools?
            </h2>
            <p className="mt-4 text-slate-700 leading-relaxed">
              Our free competitor analysis tools help Shopify merchants and ecommerce businesses understand what promotional strategies their competitors are using right now. Enter any competitor store URL and instantly see their current offers, including free shipping thresholds, discount codes, bundle deals, cart progress incentives, and gift-with-purchase offers.
            </p>
            <p className="mt-4 text-slate-700 leading-relaxed">
              These tools are designed for store owners who need quick competitive research without manual checking. Whether you're planning your next promotion, benchmarking your offers, or responding to a competitor's new campaign, these free tools provide the data you need in seconds.
            </p>

            <h3 className="mt-8 text-xl font-bold text-slate-900">
              Who Should Use These Tools?
            </h3>
            <ul className="mt-4 space-y-2 text-slate-700">
              <li>
                <strong>Shopify store owners</strong> who want to stay competitive without spending hours manually checking competitor websites
              </li>
              <li>
                <strong>Ecommerce managers</strong> who need to benchmark offers and justify promotional decisions with data
              </li>
              <li>
                <strong>Marketing agencies</strong> managing multiple client stores who need quick competitive insights
              </li>
              <li>
                <strong>Store operators</strong> launching new promotions and wanting to ensure they're competitive
              </li>
            </ul>

            <h3 className="mt-8 text-xl font-bold text-slate-900">
              How to Use These Tools
            </h3>
            <p className="mt-4 text-slate-700 leading-relaxed">
              Each tool follows a simple three-step process: paste your competitor's store URL, click analyse, and review the extracted offers. Results appear within 60 seconds showing detected promotional offers with evidence text and confidence ratings. For automatic monitoring and instant alerts when competitors change their offers, upgrade to OfferPulse Pro.
            </p>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card
                key={tool.slug}
                className="group relative flex flex-col transition-all hover:shadow-lg hover:-translate-y-1"
              >
                {tool.isFeatured && (
                  <Badge className="absolute -top-3 left-4 bg-blue-600">
                    Most popular
                  </Badge>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 transition-colors group-hover:bg-blue-600">
                      <Icon className="h-6 w-6 text-blue-600 transition-colors group-hover:text-white" />
                    </div>
                  </div>
                  <CardTitle className="mt-4 text-lg">{tool.name}</CardTitle>
                  <CardDescription>{tool.shortDescription}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button asChild className="w-full">
                    <Link href={`/free-tools/${tool.slug}`}>Open tool</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-2xl border border-blue-200 bg-blue-50 p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900">
            Want automatic monitoring and alerts?
          </h2>
          <p className="mt-2 text-slate-600">
            Get instant notifications when competitors change their offers, shipping, or pricing.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/">Start free trial</Link>
          </Button>
        </div>
      </Container>
    </div>
  );
}
