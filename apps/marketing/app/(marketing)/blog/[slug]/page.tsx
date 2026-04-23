import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { convertMarkdownToHtml } from "@/lib/blog/convert-markdown";
import { PRODUCT_HUNT_BLOG_EMBED_HTML } from "@/lib/blog/product-hunt-embed";
import { getBlogPostBySlug, getAllBlogPostSlugs, getAllBlogPosts } from "@/lib/blog/registry";
import { CANONICAL_BASE_URL, ORGANIZATION } from "@/lib/seo/config";
import { Calendar, Clock, User, ArrowRight, Sparkles } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllBlogPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) return {};

  const url = `${CANONICAL_BASE_URL}/blog/${slug}`;
  const ogImageUrl = `/og?title=${encodeURIComponent(post.title)}&subtitle=${encodeURIComponent(post.subtitle)}`;

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    keywords: post.keywords,
    authors: [{ name: post.author }],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      siteName: "OfferPulse",
      images: [
        {
          url: post.featuredImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [ogImageUrl],
      site: "@OfferPulseio",
      creator: "@OfferPulseio",
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Generate schemas
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: `${CANONICAL_BASE_URL}${post.featuredImage}`,
    author: {
      "@type": "Organization",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: ORGANIZATION.name,
      logo: {
        "@type": "ImageObject",
        url: ORGANIZATION.logo,
      },
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    url: `${CANONICAL_BASE_URL}/blog/${slug}`,
    mainEntityOfPage: `${CANONICAL_BASE_URL}/blog/${slug}`,
    keywords: post.keywords.join(", "),
    wordCount: Math.floor(post.content.split(/\s+/).length),
  };

  const faqSchema = post.faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  } : null;

  // Get related posts
  const relatedPosts = getAllBlogPosts()
    .filter((p) => p.slug !== slug && p.category === post.category)
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-white">
      {/* JSON-LD Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* Article Header */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50 to-white py-12 sm:py-16">
        <Container className="max-w-5xl">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Blog", href: "/blog" },
              { label: post.title },
            ]}
          />

          <div className="mt-8">
            <Badge className="mb-4">{post.category}</Badge>
            
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl leading-tight">
              {post.title}
            </h1>
            
            <p className="mt-6 text-xl text-slate-600 leading-relaxed">{post.subtitle}</p>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{post.readingTime} min read</span>
              </div>
            </div>

            {/* Featured Image */}
            <div className="relative mt-10 aspect-[16/9] w-full overflow-hidden rounded-2xl">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Article Content */}
      <Container className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
          {/* Main Content */}
          <article className="min-w-0">
            <aside
              className="blog-ph-embed-slot not-prose"
              aria-label="Offer Pulse on Product Hunt"
            >
              <div
                dangerouslySetInnerHTML={{ __html: PRODUCT_HUNT_BLOG_EMBED_HTML }}
              />
            </aside>
            <div
              className="blog-article-body"
              dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(post.content) }}
            />

            {/* FAQs */}
            {post.faqs.length > 0 && (
              <div className="mt-16 max-w-none border-t border-slate-200 pt-14 not-prose">
                <h2 className="mb-6 text-2xl font-bold text-slate-900">
                  Frequently Asked Questions
                </h2>
                <Accordion type="single" collapsible className="w-full">
                  {post.faqs.map((faq, idx) => (
                    <AccordionItem key={idx} value={`faq-${idx}`}>
                      <AccordionTrigger className="text-left font-semibold">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-700">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div className="mt-16 not-prose">
                <h2 className="mb-6 text-2xl font-bold text-slate-900">Related Articles</h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  {relatedPosts.map((relatedPost) => (
                    <Link key={relatedPost.slug} href={`/blog/${relatedPost.slug}`}>
                      <Card className="h-full transition-all hover:shadow-lg">
                        <CardContent className="p-6">
                          <Badge className="mb-3">{relatedPost.category}</Badge>
                          <h3 className="font-semibold text-slate-900">{relatedPost.title}</h3>
                          <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                            {relatedPost.description}
                          </p>
                          <Button variant="ghost" size="sm" className="mt-4 gap-2 p-0">
                            Read more
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* CTA Box */}
            <Card className="sticky top-24 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <Sparkles className="h-8 w-8 text-blue-600" />
                <h3 className="mt-4 font-semibold text-slate-900">
                  Try Our Free Tools
                </h3>
                <p className="mt-2 text-sm text-slate-700">
                  Analyse competitor offers, shipping thresholds, and discounts instantly
                </p>
                <Button asChild className="mt-4 w-full">
                  <Link href="/free-tools">Explore tools</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Related Tools */}
            {post.relatedTools.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-900">Related Tools</h3>
                  <div className="mt-4 space-y-2">
                    {post.relatedTools.map((toolSlug) => (
                      <Link
                        key={toolSlug}
                        href={`/free-tools/${toolSlug}`}
                        className="block rounded-lg border border-slate-200 p-3 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        {toolSlug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </Container>
    </div>
  );
}
