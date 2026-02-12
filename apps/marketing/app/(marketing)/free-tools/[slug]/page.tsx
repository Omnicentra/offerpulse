import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getToolBySlug, getAllToolSlugs } from "@/lib/tools/registry";
import { generateToolMetadata } from "@/lib/seo/metadata";
import { generateToolSchema } from "@/lib/seo/schema";
import { CheckCircle, Sparkles, ArrowRight } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllToolSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) return {};

  return generateToolMetadata({
    title: tool.metaTitle,
    description: tool.metaDescription,
    slug: tool.slug,
    toolName: tool.name,
    keywords: [tool.name, "free tool", "competitor analysis", "shopify tools"],
  });
}

export default async function ToolLandingPage({ params }: Props) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const Icon = tool.icon;
  const baseUrl = process.env.NEXT_PUBLIC_MARKETING_APP_URL || "https://offerpulse.com";
  const schemas = generateToolSchema(tool, `${baseUrl}/free-tools/${slug}`);

  const relatedTools = tool.relatedTools
    .map((s) => getToolBySlug(s))
    .filter((t): t is NonNullable<typeof t> => t !== null);

  return (
    <div className="min-h-screen">
      {/* JSON-LD Schema */}
      {schemas.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50 to-white py-16 sm:py-24">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Free Tools", href: "/free-tools" },
              { label: tool.name },
            ]}
          />
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600">
                <Icon className="h-8 w-8 text-white" />
              </div>
            </div>
            <Badge className="mb-4">Free Tool</Badge>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              {tool.name}
            </h1>
            <p className="mt-6 text-lg text-slate-600 sm:text-xl">{tool.longDescription}</p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href={`/free-tools/${slug}/tool`}>Open tool</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/">Start monitoring</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Features */}
      <section className="border-b border-slate-200 py-16">
        <Container className="max-w-4xl">
          <h2 className="text-2xl font-bold text-slate-900">Features</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {tool.features.map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                <span className="text-slate-700">{feature}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Use Cases */}
      <section className="border-b border-slate-200 bg-slate-50 py-16">
        <Container className="max-w-4xl">
          <h2 className="text-2xl font-bold text-slate-900">Use Cases</h2>
          <div className="mt-8 space-y-3">
            {tool.useCases.map((useCase, idx) => (
              <div key={idx} className="flex items-start gap-3 rounded-xl bg-white p-4">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                  {idx + 1}
                </div>
                <span className="text-slate-700">{useCase}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQs */}
      {tool.faqs.length > 0 && (
        <section className="border-b border-slate-200 py-16">
          <Container className="max-w-3xl">
            <h2 className="mb-8 text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {tool.faqs.map((faq, idx) => (
                <AccordionItem key={idx} value={`item-${idx}`}>
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-slate-600">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Container>
        </section>
      )}

      {/* Related Tools */}
      {relatedTools.length > 0 && (
        <section className="border-b border-slate-200 bg-slate-50 py-16">
          <Container>
            <h2 className="mb-8 text-2xl font-bold text-slate-900">Related Tools</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedTools.map((relatedTool) => {
                const RelatedIcon = relatedTool.icon;
                return (
                  <Card key={relatedTool.slug} className="transition-all hover:shadow-lg">
                    <CardHeader>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                        <RelatedIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="mt-4 font-semibold text-slate-900">{relatedTool.name}</h3>
                      <p className="text-sm text-slate-600">{relatedTool.shortDescription}</p>
                    </CardHeader>
                    <CardContent>
                      <Button asChild variant="outline" className="w-full">
                        <Link href={`/free-tools/${relatedTool.slug}`}>Learn more</Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </Container>
        </section>
      )}

      {/* CTA */}
      <section className="py-16">
        <Container className="max-w-3xl">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-8 text-center">
              <Sparkles className="mx-auto h-12 w-12 text-blue-600" />
              <h2 className="mt-4 text-2xl font-bold text-slate-900">
                Want automatic monitoring and alerts?
              </h2>
              <p className="mt-3 text-slate-600">
                Get instant notifications when competitors change their offers. Never miss a competitive move.
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
