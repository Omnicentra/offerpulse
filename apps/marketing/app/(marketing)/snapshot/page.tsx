"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, AlertCircle, Sparkles, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function SnapshotPageContent() {
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("cancelled");
  const abVariant = searchParams.get("ab") || "A";
  
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  const depositAmount = abVariant === "B" ? 39 : 19;

  const handleFreeQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/early-access/free-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          competitorUrl: url,
          utmSource: searchParams.get("utm_source"),
          utmMedium: searchParams.get("utm_medium"),
          utmCampaign: searchParams.get("utm_campaign"),
        }),
      });

      if (!response.ok) throw new Error("Failed to join queue");

      toast({
        title: "✅ You're on the list",
        description: "We'll email you when a slot opens.",
      });

      setEmail("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDepositCheckout = async () => {
    try {
      const response = await fetch("/api/early-access/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          competitorUrl: url,
          abVariant,
          utmSource: searchParams.get("utm_source"),
          utmMedium: searchParams.get("utm_medium"),
          utmCampaign: searchParams.get("utm_campaign"),
        }),
      });

      const { url: checkoutUrl } = await response.json();
      window.location.href = checkoutUrl;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Cancelled Banner */}
      {cancelled && (
        <div className="border-b border-yellow-200 bg-yellow-50 py-3">
          <Container className="max-w-4xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-900">Checkout cancelled</p>
                <p className="text-sm text-yellow-800">
                  No worries. You can still join the free queue, or reserve a slot when you're ready.
                </p>
              </div>
            </div>
          </Container>
        </div>
      )}

      {/* Header */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50 to-white py-16 sm:py-24">
        <Container className="max-w-4xl">
          <Badge className="mb-6">Early Access Preview</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Competitor Offer Snapshot
          </h1>
          <p className="mt-6 text-xl text-slate-700 leading-relaxed">
            See the offer mechanics competitors use to win at checkout: discount codes, free shipping thresholds, bundles, gifts, and cart incentives.
          </p>
          <p className="mt-4 text-sm text-slate-600">
            This is a preview of the report you'll get in early access. We're opening a limited number of slots.
          </p>
        </Container>
      </section>

      {/* Early Access Options - MOVED TO TOP */}
      <section className="py-16">
        <Container className="max-w-5xl">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-slate-900">Get the Full Competitor Promo Report</h2>
            <p className="mt-4 text-lg text-slate-600">
              We're opening limited slots while we validate demand. Reserve a slot to skip the queue.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              No lock-in. Refundable deposit. <Link href="/refund-policy" className="text-blue-600 hover:underline">Refund policy</Link>
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Free Queue */}
            <Card>
              <CardHeader>
                <CardTitle>Join the Free Queue</CardTitle>
                <p className="text-sm text-slate-600">
                  Get notified when we open 50 new slots. No report included.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFreeQueue} className="space-y-4">
                  <div>
                    <Label htmlFor="free-email">Email</Label>
                    <Input
                      id="free-email"
                      type="email"
                      placeholder="you@brand.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Joining..." : "Join free queue"}
                  </Button>
                  <p className="text-xs text-slate-500 text-center">
                    No spam. One email when we open access.
                  </p>
                </form>
              </CardContent>
            </Card>

            {/* Deposit Option */}
            <Card className="ring-2 ring-blue-600">
              <CardHeader>
                <Badge className="mb-2 w-fit bg-blue-600">Recommended</Badge>
                <CardTitle>Reserve Early Access (£{depositAmount} refundable deposit)</CardTitle>
                <p className="text-sm font-medium text-slate-700">
                  Get your first report within 24 hours (manual run while we scale automation)
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
                    <span className="text-sm text-slate-700">Get your first report within 24 hours (manual)</span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
                    <span className="text-sm text-slate-700">Refund anytime before launch</span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
                    <span className="text-sm text-slate-700">£{depositAmount} credited to your first month</span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
                    <span className="text-sm text-slate-700">Priority access when automated monitoring opens</span>
                  </li>
                </ul>

                <Button onClick={handleDepositCheckout} size="lg" className="w-full">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Reserve my slot for £{depositAmount}
                </Button>

                <p className="text-xs text-center text-slate-600">
                  Secure checkout via Stripe. Instant confirmation email.
                </p>
                <p className="text-sm text-center font-medium text-slate-700">
                  If OfferPulse doesn't ship what you need, we refund. Simple.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Why Deposit */}
          <Card className="mt-12 border-blue-200 bg-blue-50">
            <CardContent className="p-8">
              <h3 className="mb-3 font-semibold text-slate-900">Why a deposit?</h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                We're deliberately not scaling the backend until we know there's real demand. Deposits help us prioritise serious users and build the right monitoring first.
              </p>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* URL Input (Optional) */}
      <section className="border-b border-slate-200 bg-slate-50 py-12">
        <Container className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Competitor store URL (optional)</CardTitle>
              <p className="text-sm text-slate-600">
                Optional for now. It helps us tailor your early access slot.
              </p>
            </CardHeader>
            <CardContent>
              <Input
                type="url"
                placeholder="https://example-store.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Preview Report */}
      <section className="border-b border-slate-200 bg-slate-50 py-16">
        <Container className="max-w-5xl">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Preview Report</h2>
            <p className="mt-2 text-slate-600">
              Here's what your competitor offer report looks like once early access is enabled.
            </p>
          </div>

          {/* Score Summary (Preview) */}
          <div className="mb-12 rounded-2xl border-2 border-slate-200 bg-white p-8">
            <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
              {/* Score Ring */}
              <div className="flex justify-center">
                <div className="relative">
                  <svg className="h-64 w-64 -rotate-90" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="85" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                    <circle
                      cx="100"
                      cy="100"
                      r="85"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="12"
                      strokeDasharray="180 534"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-6xl font-bold text-slate-400">C</div>
                    <div className="text-2xl font-semibold text-slate-600">35/100</div>
                    <div className="mt-2 text-xs font-medium text-slate-500">Promo Intensity</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center space-y-6">
                <div>
                  <Badge className="bg-slate-100 text-slate-800">Low confidence</Badge>
                  <p className="mt-4 text-lg text-slate-600">
                    Minimal promotional activity detected on public pages
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Based on public signals and visible messaging
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics (Preview) */}
          <div className="mb-12">
            <h3 className="mb-6 text-xl font-semibold text-slate-900">Quick Metrics</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: "Discounts & codes", value: "2" },
                { label: "Free shipping", value: "1" },
                { label: "Bundles", value: "0" },
                { label: "Gifts & perks", value: "0" },
                { label: "Cart incentives", value: "1" },
                { label: "Urgency signals", value: "1" },
              ].map((metric) => (
                <Card key={metric.label} className="border-slate-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-slate-900">{metric.value}</div>
                    <div className="text-xs text-slate-600">{metric.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Offer Stack Preview */}
          <div>
            <h3 className="mb-6 text-2xl font-bold text-slate-900">Offer Stack Detected</h3>
            <p className="mb-6 text-slate-600">
              What we look for across the offer stack (not just price).
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                { title: "Discounts & codes", example: "10% off · Code: NEW10", source: "Announcement bar" },
                { title: "Free shipping", example: "Free shipping over £35", source: "Cart / banner" },
                { title: "Bundle offers", example: null, empty: "No bundle offers detected" },
                { title: "Gifts & perks", example: null, empty: "No gifts & perks detected" },
                { title: "Cart incentives", example: "Spend £50 to unlock a free gift", source: "Cart drawer" },
                { title: "Urgency signals", example: "Ends Sunday · Limited stock", source: "Banner" },
              ].map((category) => (
                <Card key={category.title}>
                  <CardHeader>
                    <CardTitle className="text-base">{category.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {category.example ? (
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
                          <span className="text-sm text-slate-700">{category.example}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">{category.source}</Badge>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">{category.empty}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="mt-6 text-sm text-slate-600">
              OfferPulse monitors publicly visible messaging and on-site incentives. Some stores hide incentives until checkout or after email capture. That's exactly why ongoing monitoring matters.
            </p>
          </div>
        </Container>
      </section>


      {/* Social Proof */}
      <section className="border-t border-slate-200 bg-slate-50 py-16">
        <Container className="max-w-4xl">
          <p className="mb-4 text-center text-sm text-slate-600">
            Built for Shopify brands and agencies
          </p>
          <h2 className="mb-8 text-2xl font-bold text-slate-900 text-center">
            Track the levers competitors pull — not just price
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <p className="mt-4 text-slate-700">Track the levers competitors pull at checkout</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <p className="mt-4 text-slate-700">Respond with smarter offers, not just bigger discounts</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <p className="mt-4 text-slate-700">Keep margin while protecting conversion rate</p>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-16">
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
    </div>
  );
}

const faqs = [
  {
    question: "Is the £19 deposit refundable?",
    answer: "Yes. It's fully refundable any time before launch. Just reply to your confirmation email.",
  },
  {
    question: "Is the £19 credited later?",
    answer: "Yes. When early access goes live, your £19 is credited to your first paid month.",
  },
  {
    question: "What will OfferPulse detect?",
    answer: "Discount codes, free shipping thresholds, bundles, gifts & perks, cart incentives, and urgency signals. The goal is to show the offer mechanics that influence conversion and AOV.",
  },
  {
    question: "Does this work for Shopify only?",
    answer: "OfferPulse is built for Shopify first. If you're on another platform, join the queue and tell us in the notes.",
  },
  {
    question: "Can you always see checkout-only incentives?",
    answer: "Some incentives are only visible at checkout or after an email step. That's why ongoing monitoring and evidence capture matter. This page is a preview of the reporting format.",
  },
  {
    question: "When do I get access?",
    answer: "As soon as we open your slot. Deposits get priority. We'll email you when your slot is ready.",
  },
  {
    question: "Will you store competitor data?",
    answer: "We store monitoring results (offer signals and evidence) to show history and changes. We don't sell competitor data.",
  },
];

export default function SnapshotPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    }>
      <SnapshotPageContent />
    </Suspense>
  );
}
