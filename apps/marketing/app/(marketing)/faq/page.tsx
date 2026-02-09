import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SectionHeading } from "@/components/section-heading"
import { FaqWithSearch } from "@/components/faq-with-search"
import { CtaSection } from "@/components/cta-section"
import { ArrowRight, Mail } from "lucide-react"

export const metadata: Metadata = {
  title: "FAQ | OfferPulse",
  description:
    "Frequently asked questions about OfferPulse competitor offer monitoring. Learn about pricing, features, and how it works.",
  openGraph: {
    title: "FAQ | OfferPulse",
    description:
      "Frequently asked questions about OfferPulse competitor offer monitoring.",
  },
}

export default function FaqPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="FAQ"
            title="Frequently asked questions"
            description="Everything you need to know about OfferPulse. Can't find what you're looking for? Get in touch."
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FaqWithSearch />
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="bg-muted/30 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-foreground">
            Still have questions?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Can&apos;t find the answer you&apos;re looking for? Our team is here to help.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild>
              <a href="mailto:support@offerpulse.io">
                Contact support
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link href="/how-it-works">Learn how it works</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <CtaSection />
    </>
  )
}
