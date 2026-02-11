import { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SectionHeading } from "@/components/section-heading"
import { CtaSection } from "@/components/cta-section"
import { getAllBlogPosts } from "@/lib/blog/registry"
import { ArrowRight, Clock, Calendar } from "lucide-react"

export const metadata: Metadata = {
  title: "Blog | OfferPulse",
  description:
    "Insights on competitor monitoring, ecommerce strategy, and promotional optimisation for Shopify sellers.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Blog | OfferPulse",
    description:
      "Insights on competitor monitoring and ecommerce strategy for Shopify sellers.",
  },
}

const blogPosts = getAllBlogPosts()

export default function BlogPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Blog"
            title="Competitive intelligence insights"
            description="Strategies, research, and analysis for Shopify sellers who want to stay ahead of the competition."
          />
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                <Card className="flex h-full flex-col transition-all hover:shadow-lg hover:-translate-y-1">
                  <CardHeader>
                    <Badge className="mb-2 w-fit">{post.category}</Badge>
                    <CardTitle className="text-xl leading-tight group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <CardDescription className="flex-1 text-sm leading-relaxed">
                      {post.description}
                    </CardDescription>
                    <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        <time dateTime={post.publishedAt}>
                          {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </time>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{post.readingTime} min read</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="mt-4 gap-2 p-0 text-blue-600">
                      Read article
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Link to Free Tools */}
          <div className="mt-16">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold text-slate-900">
                  Try Our Free Competitor Analysis Tools
                </h2>
                <p className="mt-2 text-slate-600">
                  Get instant insights on competitor offers, shipping thresholds, and discounts
                </p>
                <Button asChild size="lg" className="mt-6">
                  <Link href="/free-tools">Explore free tools</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <CtaSection
        title="Ready to track competitor offers?"
        description="Stop missing promotions. Start protecting your conversion."
      />
    </>
  )
}
