import { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SectionHeading } from "@/components/section-heading"
import { CtaSection } from "@/components/cta-section"
import { ArrowRight, Clock } from "lucide-react"

export const metadata: Metadata = {
  title: "Blog | OfferPulse",
  description:
    "Insights on competitor monitoring, e-commerce strategy, and promotional optimisation for Shopify sellers.",
  openGraph: {
    title: "Blog | OfferPulse",
    description:
      "Insights on competitor monitoring and e-commerce strategy for Shopify sellers.",
  },
}

const blogPosts = [
  {
    title: "How to monitor competitor promos without spreadsheets",
    description:
      "Stop copying URLs into sheets and checking manually. A simple workflow for tracking competitor promos, shipping thresholds, and bundles without the spreadsheet headache.",
    category: "Strategy",
    readTime: "5 min read",
    date: "15 Jan 2025",
    slug: "#",
  },
  {
    title: "Free shipping thresholds: what top Shopify brands do",
    description:
      "A £10 change in your free shipping threshold can shift basket sizes across your market. We look at how leading Shopify brands set and adjust their thresholds.",
    category: "Research",
    readTime: "6 min read",
    date: "8 Jan 2025",
    slug: "#",
  },
  {
    title: "Bundles vs discounts: protecting margin",
    description:
      "Bundle offers often outperform straight discounts on perceived value — and protect margin. When to use each approach and how to track what competitors are doing.",
    category: "Analysis",
    readTime: "7 min read",
    date: "2 Jan 2025",
    slug: "#",
  },
]

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
            {blogPosts.map((post, index) => (
              <Card key={index} className="flex flex-col">
                <CardHeader>
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="secondary">{post.category}</Badge>
                  </div>
                  <CardTitle className="text-xl leading-tight">
                    <Link href={post.slug} className="hover:text-primary">
                      {post.title}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <CardDescription className="flex-1 text-sm leading-relaxed">
                    {post.description}
                  </CardDescription>
                  <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <span>{post.date}</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* More Posts Coming */}
          <div className="mt-16 text-center">
            <p className="text-muted-foreground">
              More posts coming soon. Want to be notified?
            </p>
            <Link
              href="/auth/sign-up"
              className="mt-2 inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              Join early access for updates
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
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
