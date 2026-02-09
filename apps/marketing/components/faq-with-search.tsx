"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  { question: "Is this just price tracking?", answer: "No. While we do note price changes, OfferPulse focuses on the promotional layer: discounts, bundles, free shipping thresholds, cart incentives, and delivery promises. These offers often have a bigger impact on conversion than base pricing alone." },
  { question: "Does it work on non-Shopify sites?", answer: "OfferPulse works best with Shopify stores, but we also support most major e-commerce platforms including WooCommerce, BigCommerce, and Magento. If you're unsure, try running an Offer Snapshot on your competitor's site — if we can detect offers, we can track them." },
  { question: "How often do you check pages?", answer: "We check monitored pages multiple times per day. Growth and Agency plans get more frequent checks, which means you'll catch changes faster. The exact frequency depends on your plan and the number of competitors you're tracking." },
  { question: "Will I get false alerts?", answer: "We use multiple detection methods to filter out noise, but occasional false positives can happen — especially with dynamic content. You can mark alerts as false positives to help our system learn, and we continuously improve our detection accuracy." },
  { question: "Do I need to install a Shopify app?", answer: "No installation required. OfferPulse monitors competitor sites from our servers, so there's nothing to install on your store or your competitors' stores. Just paste URLs and start tracking." },
  { question: "Can I cancel anytime?", answer: "Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees. When you cancel, you'll retain access until the end of your current billing period." },
  { question: "Is there a free plan?", answer: "We don't offer a free plan, but you can generate one free Offer Snapshot without creating an account. Once you sign up, all plans include a 14-day free trial so you can test the full feature set before committing." },
  { question: "What pages should I monitor?", answer: "We recommend monitoring your competitors' homepage (for sitewide offers), key product pages, and collection pages. Cart and checkout pages can also reveal last-minute incentives. Start with 3-5 pages per competitor and expand based on what you learn." },
]

export function FaqWithSearch() {
  const [query, setQuery] = useState("")
  const filtered = useMemo(() => {
    if (!query.trim()) return faqs
    const q = query.toLowerCase()
    return faqs.filter((f) => f.question.toLowerCase().includes(q))
  }, [query])

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search questions…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-11 rounded-xl pl-10"
          aria-label="Search FAQ"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No questions match your search.
        </p>
      ) : (
        <Accordion type="single" collapsible className="w-full space-y-2">
          {filtered.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="rounded-2xl border border-border bg-card px-4 shadow-soft"
            >
              <AccordionTrigger className="text-left hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}
