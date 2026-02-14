"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getToolBySlug } from "@/lib/tools/registry";
import { buildAppSignupUrl } from "@offerpulse/lib/routing";
import { calculateOfferScore, getScoreInterpretation, getMechanicCount } from "@/lib/tools/scoring";
import { ScoreSummary } from "@/components/snapshot-report/ScoreSummary";
import { ScanProgress } from "@/components/snapshot-report/ScanProgress";
import { ReportHeader } from "@/components/snapshot-report/ReportHeader";
import { ArrowLeft, AlertCircle, ExternalLink, Loader2, Sparkles, ArrowRight, Lock, TrendingUp } from "lucide-react";
import type { ExtractedOffer } from "@/lib/tools/extractor";

export default function ToolPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const tool = getToolBySlug(slug);

  const urlParam = searchParams.get("url");
  const hasAutoRun = useRef(false);

  const [url, setUrl] = useState(urlParam || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-run if URL is in query params (only once)
  useEffect(() => {
    if (urlParam && slug === "offer-snapshot" && !hasAutoRun.current && !result && !loading) {
      hasAutoRun.current = true;
      handleSubmit(new Event("submit") as any);
    }
  }, [urlParam, slug]);

  if (!tool) {
    return (
      <Container className="py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Tool not found</h1>
          <Button asChild className="mt-4">
            <Link href="/free-tools">Back to tools</Link>
          </Button>
        </div>
      </Container>
    );
  }

  const Icon = tool.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/tools/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyse store");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Calculate score if we have results
  const offerScore = result?.offers ? calculateOfferScore(result.offers) : null;
  const scoreInterpretation = offerScore ? getScoreInterpretation(offerScore.total) : "";

  // Show SEOptimer-style report if this is offer-snapshot tool with results
  if (slug === "offer-snapshot" && result && offerScore) {
    return (
      <div className="min-h-screen bg-white">
        {/* Report Header */}
        <ReportHeader
          domain={new URL(result.url).hostname}
          timestamp={new Date(result.timestamp).toLocaleString()}
          url={result.url}
          onRescan={() => {
            setResult(null);
            setError(null);
          }}
        />

        {/* Main Report Content */}
        <Container className="py-12">
          {/* Score Summary - SEOptimer style */}
          <div className="mb-16">
            <h2 className="mb-8 text-3xl font-bold text-slate-900">Your Competitor Offer Report</h2>
            <ScoreSummary score={offerScore} interpretation={scoreInterpretation} />
          </div>

          {/* Offer Stack Detected */}
          <div className="mb-16">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">Offer Stack Detected</h2>
            <OfferResults offers={result.offers} />
          </div>

          {/* Start Monitoring CTA */}
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-8 text-center">
              <Sparkles className="mx-auto h-12 w-12 text-blue-600" />
              <h2 className="mt-4 text-2xl font-bold text-slate-900">
                Want alerts when this changes?
              </h2>
              <p className="mt-3 text-slate-700">
                Get instant notifications when this competitor changes their offers, shipping, or incentives
              </p>
              <Button asChild size="lg" className="mt-6">
                <Link href={buildAppSignupUrl({ competitorUrl: result.url, source: "snapshot_tool" })}>
                  Start monitoring this competitor
                </Link>
              </Button>
              <p className="mt-4 text-sm text-slate-600">
                Track changes, get alerts, and see suggested responses
              </p>
            </CardContent>
          </Card>
        </Container>
      </div>
    );
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
          <Link href={`/free-tools/${slug}`} className="hover:text-slate-900">
            {tool.name}
          </Link>
          <span>/</span>
          <span className="text-slate-900">Tool</span>
        </nav>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{tool.name}</h1>
              <p className="mt-1 text-sm text-slate-600">{tool.shortDescription}</p>
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
                <CardDescription>Enter any competitor store URL</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">Store URL</Label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://competitor-store.com"
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
                  Some stores block automated checks. Results may vary. For public information only.
                </p>
              </CardContent>
            </Card>

            {/* Info about tool */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-base">About this tool</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-700">
                <Link href={`/free-tools/${slug}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                  Learn more about {tool.name}
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
                        Start monitoring to get instant notifications when competitors update their offers
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
            {loading && slug === "offer-snapshot" && (
              <ScanProgress />
            )}

            {loading && slug !== "offer-snapshot" && (
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="mt-2 h-4 w-full" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                </CardContent>
              </Card>
            )}

            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="flex items-start gap-3 pt-6">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-900">Analysis failed</p>
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
                        <Badge variant="outline" className="text-xs flex-shrink-0">
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
                    <Icon className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="mt-4 font-medium text-slate-900">Enter a URL to get started</p>
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

function OfferResults({ offers }: { offers: ExtractedOffer }) {
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
          No obvious offer text detected. Offers might be dynamic, require login, or hidden in cart flow.
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
                {offers.shippingThreshold.currency} {offers.shippingThreshold.amount}
              </p>
              <p className="mt-1 text-sm text-blue-700 break-words">
                "{offers.shippingThreshold.evidenceText}"
              </p>
            </div>
            <Badge variant="outline" className="flex-shrink-0">{offers.shippingThreshold.locationHint}</Badge>
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
              <div key={idx} className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-purple-800">
                    {discount.value}% off
                    {discount.code && ` • Code: ${discount.code}`}
                  </p>
                  <p className="text-xs text-purple-700 break-words">"{discount.evidenceText}"</p>
                </div>
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {discount.locationHint}
                </Badge>
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
                <p className="text-sm text-orange-800 break-words">"{bundle.evidenceText}"</p>
                <Badge variant="outline" className="mt-1 text-xs">
                  {bundle.locationHint}
                </Badge>
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
                <p className="text-sm text-green-800 break-words">"{gift.evidenceText}"</p>
                <Badge variant="outline" className="mt-1 text-xs">
                  {gift.locationHint}
                </Badge>
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
                <p className="text-sm text-indigo-800 break-words">"{incentive.evidenceText}"</p>
                <Badge variant="outline" className="mt-1 text-xs">
                  {incentive.locationHint}
                </Badge>
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
          {offers.announcements.map((ann, idx) => (
            <p key={idx} className="mt-2 text-sm text-slate-700 break-words">
              "{ann}"
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
