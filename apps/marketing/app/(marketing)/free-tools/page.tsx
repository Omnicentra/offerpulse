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
            Free tools for tracking competitor offers
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-600 sm:text-xl">
            Paste a competitor URL and get instant insights. Upgrade to monitor changes
            automatically and never miss a competitive move.
          </p>
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
