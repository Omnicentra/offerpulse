"use client";

import { Container } from "@/components/container";
import { MetricsRow } from "@/components/snapshot-report/MetricsRow";
import { OfferStackCard } from "@/components/snapshot-report/OfferStackCard";
import { RecommendationsCard } from "@/components/snapshot-report/RecommendationsCard";
import { ReportHeader } from "@/components/snapshot-report/ReportHeader";
import { ScanProgress } from "@/components/snapshot-report/ScanProgress";
import { ScoreSummary } from "@/components/snapshot-report/ScoreSummary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ExtractedOffer } from "@/lib/tools/extractor";
import type {
  OfferSnapshotResponse,
  PageResult,
} from "@/app/api/tools/offer-snapshot/route";
import type { AggregatedOffer } from "@/lib/tools/aggregator";
import {
  calculateOfferScore,
  getScoreInterpretation,
} from "@/lib/tools/scoring";
import { normalizeUrl, validateUrl } from "@/lib/url-helpers";
import { buildAppSignupUrl } from "@offerpulse/lib/routing";
import {
  AlertCircle,
  ArrowRight,
  Camera,
  Clock,
  ExternalLink,
  Gift,
  Loader2,
  Package,
  Percent,
  ShoppingCart,
  Sparkles,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";

interface OfferSnapshotToolClientProps {
  urlParam: string | null;
}

export function OfferSnapshotToolClient({
  urlParam,
}: OfferSnapshotToolClientProps) {
  const hasAutoRun = useRef(false);

  const [url, setUrl] = useState(urlParam || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OfferSnapshotResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);

  // Auto-run if URL is in query params (only once)
  useEffect(() => {
    if (urlParam && !hasAutoRun.current && !result && !loading) {
      hasAutoRun.current = true;
      handleSubmit(new Event("submit") as unknown as React.FormEvent);
    }
  }, [urlParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    // Normalize and validate URL
    const normalizedUrl = normalizeUrl(url);
    const validation = validateUrl(url);

    if (!validation.ok || !normalizedUrl) {
      setError(validation.reason || "Enter a valid store URL (e.g. brand.com)");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/tools/offer-snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      const data: OfferSnapshotResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          (data as unknown as { error?: string }).error ||
            "Failed to analyse store",
        );
      }

      setResult(data);

      // Track successful analysis in PostHog
      posthog.capture("offer_tool_analyzed", {
        tool_slug: "offer-snapshot",
        analyzed_url: normalizedUrl,
        offers_found: Object.values(data.offers).flat().length,
        has_discounts: data.offers.discounts.length > 0,
        has_shipping: !!data.offers.shippingThreshold,
        has_bundles: data.offers.bundles.length > 0,
        has_gifts: data.offers.gifts.length > 0,
        cached: data.cached ?? false,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);

      // Track error in PostHog
      posthog.capture("offer_tool_error", {
        tool_slug: "offer-snapshot",
        analyzed_url: normalizedUrl,
        error: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate score if we have results
  const offerScore = result?.offers ? calculateOfferScore(result.offers) : null;
  const scoreInterpretation = offerScore
    ? getScoreInterpretation(offerScore.total)
    : "";

  // Show SEOptimer-style report if we have results
  if (result && offerScore) {
    const offers = result.offers as AggregatedOffer;
    const domain = result.domain || new URL(result.url).hostname;
    const screenshotUrl = result.screenshotUrl;
    const pagesAnalyzed = result.pagesAnalyzed || [];
    const stats = result.stats;
    const reportSignupUrl = buildAppSignupUrl({
      competitorUrl: result.url,
      source: "offer_snapshot_report",
    });

    // Build metrics
    const metrics = {
      discounts: offers.discounts.length,
      shippingIncentives: offers.shippingThreshold ? 1 : 0,
      bundles: offers.bundles.length,
      gifts: offers.gifts.length,
      cartIncentives: offers.cartIncentives.length,
      urgencyWidgets: offers.announcements.length,
    };

    // Build offer items by category (with source pages)
    const discountItems = offers.discounts.map((d) => ({
      text: `${d.value}% off${d.code ? ` • Code: ${d.code}` : ""}`,
      location: d.locationHint,
      evidenceText: d.evidenceText,
      sourcePages: d.sourcePages || [],
    }));

    const shippingItems = offers.shippingThreshold
      ? [
          {
            text: `Free shipping over ${offers.shippingThreshold.currency}${offers.shippingThreshold.amount}`,
            location: offers.shippingThreshold.locationHint,
            evidenceText: offers.shippingThreshold.evidenceText,
            sourcePages: offers.shippingThreshold.sourcePages || [],
          },
        ]
      : [];

    const bundleItems = offers.bundles.map((b) => ({
      text: b.evidenceText,
      location: b.locationHint,
      sourcePages: b.sourcePages || [],
    }));

    const giftItems = offers.gifts.map((g) => ({
      text: g.evidenceText,
      location: g.locationHint,
      sourcePages: g.sourcePages || [],
    }));

    const cartItems = offers.cartIncentives.map((c) => ({
      text: c.evidenceText,
      location: c.locationHint,
      sourcePages: c.sourcePages || [],
    }));

    // Generate recommendations
    const recommendations = generateRecommendations(offers);

    return (
      <div className="min-h-screen bg-white">
        {/* Report Header */}
        <ReportHeader
          domain={domain}
          timestamp={new Date(result.timestamp).toLocaleString()}
          url={result.url}
          onRescan={() => {
            setResult(null);
            setError(null);
            setUrl(result.url);
          }}
        />

        {/* Main Report Content */}
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Score Summary Section */}
          <div className="mb-16">
            <header className="flex items-start justify-between">
              <div>
                <h2 className="mb-2 text-3xl font-bold text-slate-900">
                  Your Competitor Offer Report
                </h2>
                <p className="mb-8 text-slate-600">
                  Comprehensive analysis of promotional mechanics
                </p>
              </div>
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => {
                  window.location.href = reportSignupUrl;
                }}
              >
                Start monitoring
              </Button>
            </header>
            <ScoreSummary
              score={offerScore}
              interpretation={scoreInterpretation}
              metrics={metrics}
            />
          </div>

          {/* Screenshot Section */}
          {screenshotUrl && (
            <div className="mb-16">
              <h3 className="mb-6 text-2xl font-bold text-slate-900">
                Site Screenshot
              </h3>
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div
                    className="relative h-[420px] overflow-y-auto overflow-x-hidden border-b border-slate-200 bg-slate-100 cursor-pointer group rounded-t-lg"
                    onClick={() => setShowScreenshotModal(true)}
                  >
                    <div className="relative w-full min-h-full">
                      <Image
                        src={screenshotUrl}
                        alt={`Screenshot of ${domain}`}
                        width={1920}
                        height={5000}
                        className="w-full min-w-full object-top object-contain transition-opacity group-hover:opacity-90"
                        unoptimized
                        sizes="(max-width: 1024px) 100vw, 1152px"
                      />
                    </div>
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-3 shadow-lg">
                        <ExternalLink className="h-6 w-6 text-slate-900" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50">
                    <p className="text-sm text-slate-600">
                      Captured on{" "}
                      {new Date(result.timestamp).toLocaleDateString()} at{" "}
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Click to view full size
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Pages Analyzed Section */}
          {pagesAnalyzed.length > 0 && (
            <div className="mb-16">
              <h3 className="mb-4 text-2xl font-bold text-slate-900">
                Pages Analyzed
              </h3>
              <p className="mb-6 text-slate-600">
                Scanned {stats?.successfulPages || pagesAnalyzed.length} pages
                across shipping, FAQ, products, and policy pages
              </p>
              <Card>
                <CardContent className="p-6">
                  <div className="grid gap-3">
                    {pagesAnalyzed.slice(0, 10).map((page) => (
                      <div
                        key={page.url}
                        className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {page.title || new URL(page.url).pathname}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {page.url}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {page.scrapedSuccessfully ? (
                            <>
                              <Badge variant="outline" className="text-xs">
                                {page.offersFound} offers
                              </Badge>
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                ✓ Scraped
                              </Badge>
                            </>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              Failed
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {pagesAnalyzed.length > 10 && (
                      <p className="text-sm text-slate-500 text-center pt-2">
                        + {pagesAnalyzed.length - 10} more pages analyzed
                      </p>
                    )}
                  </div>
                  {stats && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-slate-900">
                            {stats.totalPages}
                          </p>
                          <p className="text-xs text-slate-600">Total Pages</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">
                            {stats.successfulPages}
                          </p>
                          <p className="text-xs text-slate-600">Successful</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-900">
                            {stats.deduplicationRate}%
                          </p>
                          <p className="text-xs text-slate-600">
                            Duplicates Removed
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Metrics Overview */}
          <div className="mb-16">
            <h3 className="mb-6 text-xl font-semibold text-slate-900">
              Quick Metrics
            </h3>
            <MetricsRow metrics={metrics} />
          </div>

          {/* Offer Stack Detected */}
          <div className="mb-16">
            <h3 className="mb-6 text-2xl font-bold text-slate-900">
              Offer Stack Detected
            </h3>
            <div className="grid gap-6 lg:grid-cols-2">
              <OfferStackCard
                category="Discounts & Codes"
                items={discountItems}
                icon={Percent}
              />
              <OfferStackCard
                category="Free Shipping"
                items={shippingItems}
                icon={Truck}
              />
              <OfferStackCard
                category="Bundle Offers"
                items={bundleItems}
                icon={Package}
              />
              <OfferStackCard
                category="Gifts & Perks"
                items={giftItems}
                icon={Gift}
              />
              <OfferStackCard
                category="Cart Incentives"
                items={cartItems}
                icon={ShoppingCart}
              />
              <OfferStackCard
                category="Urgency Signals"
                items={offers.announcements.map((a: any) => ({
                  text: typeof a === "string" ? a : a.text,
                  location: "Announcement bar",
                  sourcePages:
                    typeof a === "object" && a.sourcePages ? a.sourcePages : [],
                }))}
                icon={Clock}
              />
            </div>
          </div>

          {/* Recommendations */}
          <div className="mb-16">
            <RecommendationsCard
              visibleRecommendations={recommendations.visible}
              lockedCount={recommendations.locked}
              signupUrl={reportSignupUrl}
            />
          </div>

          {/* Final CTA */}
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-8 text-center">
              <Sparkles className="mx-auto h-12 w-12 text-blue-600" />
              <h2 className="mt-4 text-2xl font-bold text-slate-900">
                Start Tracking {domain}
              </h2>
              <p className="mt-3 text-slate-700">
                Get instant alerts when they change offers, shipping thresholds,
                bundles, or cart incentives
              </p>
              <Button
                size="lg"
                className="mt-6"
                onClick={() => {
                  window.location.href = reportSignupUrl;
                }}
              >
                Start monitoring this competitor
              </Button>
              <p className="mt-4 text-sm text-slate-600">
                From £19/mo • 14-day free trial • No credit card required
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Screenshot Lightbox Modal */}
        {showScreenshotModal && screenshotUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setShowScreenshotModal(false)}
          >
            <div className="relative max-h-[90vh] max-w-[90vw] overflow-auto">
              <button
                onClick={() => setShowScreenshotModal(false)}
                className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 shadow-lg hover:bg-slate-100"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <Image
                src={screenshotUrl}
                alt={`Full screenshot of ${domain}`}
                width={1920}
                height={1080}
                className="rounded-lg object-contain"
                onClick={(e) => e.stopPropagation()}
                unoptimized
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Helper function to generate recommendations
  function generateRecommendations(offers: ExtractedOffer | AggregatedOffer) {
    const visible = [];
    const locked = 3;

    if (offers.shippingThreshold) {
      visible.push({
        title: `Match or test a ${offers.shippingThreshold.currency}${offers.shippingThreshold.amount} free shipping threshold`,
        description: `They offer free shipping at ${offers.shippingThreshold.currency}${offers.shippingThreshold.amount}. Consider matching this threshold or testing a higher threshold with a gift-with-purchase to protect margin.`,
        effort: "Low" as const,
        impact: "High" as const,
      });
    }

    if (offers.bundles.length > 0) {
      visible.push({
        title: "Add a bundle offer to protect margin vs straight discounts",
        description:
          "Bundle offers preserve margin better than percentage discounts while creating perceived value.",
        effort: "Medium" as const,
        impact: "High" as const,
      });
    }

    if (offers.discounts.length > 0) {
      visible.push({
        title:
          "Counter with a different offer type instead of matching discount",
        description:
          "Instead of matching their discount percentage, consider a bundle, gift, or shipping offer that protects margin.",
        effort: "Low" as const,
        impact: "Medium" as const,
      });
    }

    // Ensure at least 3 recommendations
    while (visible.length < 3) {
      visible.push({
        title: "Add a cart progress incentive to increase AOV",
        description:
          "Show customers how close they are to free shipping or a gift to encourage higher order values.",
        effort: "Medium" as const,
        impact: "High" as const,
      });
    }

    return { visible: visible.slice(0, 3), locked };
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Container className="py-8 sm:py-12">
        {/* Breadcrumbs */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-600">
          <Link href="/free-tools" className="hover:text-slate-900">
            Free tools
          </Link>
          <span>/</span>
          <Link
            href="/free-tools/offer-snapshot"
            className="hover:text-slate-900"
          >
            Competitor Offer Snapshot
          </Link>
          <span>/</span>
          <span className="text-slate-900">Tool</span>
        </nav>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <Camera className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Competitor Offer Snapshot
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Capture and analyse all visible offers from any store instantly
              </p>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
          {/* Left: Input form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analyse a store</CardTitle>
                <CardDescription>
                  Enter any competitor store URL
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">Store URL</Label>
                    <Input
                      id="url"
                      type="text"
                      placeholder="competitor-store.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analysing...
                      </>
                    ) : (
                      "Analyse store"
                    )}
                  </Button>
                </form>

                <p className="mt-4 text-xs text-slate-500">
                  Some stores block automated checks. Results may vary. For
                  public information only.
                </p>
              </CardContent>
            </Card>

            {/* Info about tool */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-base">About this tool</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-700">
                <Link
                  href="/free-tools/offer-snapshot"
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  Learn more about Competitor Offer Snapshot
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>

            {/* Upgrade CTA */}
            {result && (
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 flex-shrink-0 text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Want alerts when this changes?
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Start monitoring to get instant notifications when
                        competitors update their offers
                      </p>
                      <Button asChild size="sm" className="mt-4">
                        <Link href="/">Start monitoring →</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Results */}
          <div>
            {loading && <ScanProgress />}

            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="flex items-start gap-3 pt-6">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-900">
                      Analysis failed
                    </p>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        setError(null);
                        setResult(null);
                      }}
                    >
                      Try again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {result && !loading && !error && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle>Analysis Results</CardTitle>
                        <CardDescription className="mt-2 flex items-center gap-2">
                          <ExternalLink className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{result.url}</span>
                        </CardDescription>
                      </div>
                      {result.cached && (
                        <Badge
                          variant="outline"
                          className="text-xs flex-shrink-0"
                        >
                          Cached
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <OfferResults offers={result.offers} />
                  </CardContent>
                </Card>
              </div>
            )}

            {!loading && !error && !result && (
              <Card className="border-2 border-dashed border-slate-200">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                    <Camera className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="mt-4 font-medium text-slate-900">
                    Enter a URL to get started
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Results will appear here after analysis
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}

function OfferResults({
  offers,
}: {
  offers: ExtractedOffer | AggregatedOffer;
}) {
  const hasAnyOffers =
    offers.shippingThreshold ||
    offers.discounts.length > 0 ||
    offers.bundles.length > 0 ||
    offers.gifts.length > 0 ||
    offers.cartIncentives.length > 0;

  if (!hasAnyOffers && offers.announcements.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-sm text-slate-600">
          No obvious offer text detected. Offers might be dynamic, require
          login, or hidden in cart flow.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Shipping Threshold */}
      {offers.shippingThreshold && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-900">
                Free Shipping
              </p>
              <p className="mt-2 text-lg font-bold text-blue-800">
                {offers.shippingThreshold.currency}{" "}
                {offers.shippingThreshold.amount}
              </p>
              <p className="mt-1 text-sm text-blue-700 break-words">
                &quot;{offers.shippingThreshold.evidenceText}&quot;
              </p>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <Badge variant="outline" className="flex-shrink-0">
                {offers.shippingThreshold.locationHint}
              </Badge>
              {(offers.shippingThreshold as any).sourcePages &&
                (offers.shippingThreshold as any).sourcePages.length > 0 && (
                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                    Found on:{" "}
                    {(offers.shippingThreshold as any).sourcePages
                      .slice(0, 2)
                      .join(", ")}
                    {(offers.shippingThreshold as any).sourcePages.length > 2 &&
                      ` +${(offers.shippingThreshold as any).sourcePages.length - 2}`}
                  </Badge>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Discounts */}
      {offers.discounts.length > 0 && (
        <div className="rounded-xl bg-purple-50 border border-purple-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-900">
            Discounts ({offers.discounts.length})
          </p>
          <div className="mt-3 space-y-2">
            {offers.discounts.map((discount, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-4 flex-wrap"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-purple-800">
                    {discount.value}% off
                    {discount.code && ` • Code: ${discount.code}`}
                  </p>
                  <p className="text-xs text-purple-700 break-words">
                    &quot;{discount.evidenceText}&quot;
                  </p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {discount.locationHint}
                  </Badge>
                  {(discount as any).sourcePages &&
                    (discount as any).sourcePages.length > 0 && (
                      <Badge className="bg-purple-100 text-purple-800 text-xs">
                        {(discount as any).sourcePages.slice(0, 2).join(", ")}
                        {(discount as any).sourcePages.length > 2 &&
                          ` +${(discount as any).sourcePages.length - 2}`}
                      </Badge>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bundles */}
      {offers.bundles.length > 0 && (
        <div className="rounded-xl bg-orange-50 border border-orange-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-900">
            Bundle Offers ({offers.bundles.length})
          </p>
          <div className="mt-3 space-y-2">
            {offers.bundles.map((bundle, idx) => (
              <div key={idx}>
                <p className="text-sm text-orange-800 break-words">
                  &quot;{bundle.evidenceText}&quot;
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">
                    {bundle.locationHint}
                  </Badge>
                  {(bundle as any).sourcePages &&
                    (bundle as any).sourcePages.length > 0 && (
                      <Badge className="bg-orange-100 text-orange-800 text-xs">
                        {(bundle as any).sourcePages.slice(0, 2).join(", ")}
                        {(bundle as any).sourcePages.length > 2 &&
                          ` +${(bundle as any).sourcePages.length - 2}`}
                      </Badge>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gifts */}
      {offers.gifts.length > 0 && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-green-900">
            Gifts ({offers.gifts.length})
          </p>
          <div className="mt-3 space-y-2">
            {offers.gifts.map((gift, idx) => (
              <div key={idx}>
                <p className="text-sm text-green-800 break-words">
                  &quot;{gift.evidenceText}&quot;
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">
                    {gift.locationHint}
                  </Badge>
                  {(gift as any).sourcePages &&
                    (gift as any).sourcePages.length > 0 && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        {(gift as any).sourcePages.slice(0, 2).join(", ")}
                        {(gift as any).sourcePages.length > 2 &&
                          ` +${(gift as any).sourcePages.length - 2}`}
                      </Badge>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cart Incentives */}
      {offers.cartIncentives.length > 0 && (
        <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-900">
            Cart Incentives ({offers.cartIncentives.length})
          </p>
          <div className="mt-3 space-y-2">
            {offers.cartIncentives.map((incentive, idx) => (
              <div key={idx}>
                <p className="text-sm text-indigo-800 break-words">
                  &quot;{incentive.evidenceText}&quot;
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">
                    {incentive.locationHint}
                  </Badge>
                  {(incentive as any).sourcePages &&
                    (incentive as any).sourcePages.length > 0 && (
                      <Badge className="bg-indigo-100 text-indigo-800 text-xs">
                        {(incentive as any).sourcePages.slice(0, 2).join(", ")}
                        {(incentive as any).sourcePages.length > 2 &&
                          ` +${(incentive as any).sourcePages.length - 2}`}
                      </Badge>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Announcements */}
      {offers.announcements.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Announcement Bar
          </p>
          {offers.announcements.map((ann, idx) => {
            const annText = typeof ann === "string" ? ann : (ann as any).text;
            const annSourcePages =
              typeof ann === "object" && (ann as any).sourcePages
                ? (ann as any).sourcePages
                : [];
            return (
              <div key={idx} className="mt-2">
                <p className="text-sm text-slate-700 break-words">
                  &quot;{annText}&quot;
                </p>
                {annSourcePages.length > 0 && (
                  <Badge className="bg-slate-100 text-slate-700 text-xs mt-1">
                    {annSourcePages.slice(0, 2).join(", ")}
                    {annSourcePages.length > 2 &&
                      ` +${annSourcePages.length - 2}`}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
