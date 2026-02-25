"use client";

import { Container } from "@/components/container";
import { ClarityCheckProgress } from "@/components/snapshot-report/ClarityCheckProgress";
import { ReportHeader } from "@/components/snapshot-report/ReportHeader";
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
import type { OfferClarityResponse } from "@/app/api/tools/offer-clarity-check/route";
import { normalizeUrl, validateUrl } from "@/lib/url-helpers";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";

interface OfferClarityCheckToolClientProps {
  urlParam: string | null;
}

export function OfferClarityCheckToolClient({ urlParam }: OfferClarityCheckToolClientProps) {
  const hasAutoRun = useRef(false);

  const [url, setUrl] = useState(urlParam || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OfferClarityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const response = await fetch("/api/tools/offer-clarity-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      const data: OfferClarityResponse = await response.json();

      if (!response.ok) {
        throw new Error((data as unknown as { error?: string }).error || "Failed to analyse store");
      }

      setResult(data);

      // Track successful analysis in PostHog
      posthog.capture("offer_tool_analyzed", {
        tool_slug: "offer-clarity-check",
        analyzed_url: normalizedUrl,
        offers_found: Object.values(data.offers).flat().length,
        has_discounts: data.offers.discounts.length > 0,
        has_shipping: !!data.offers.shippingThreshold,
        has_bundles: data.offers.bundles.length > 0,
        has_gifts: data.offers.gifts.length > 0,
        cached: data.cached ?? false,
        clarity_score: data.clarity.score,
        clarity_suggestions_count: data.clarity.suggestions.length,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);

      // Track error in PostHog
      posthog.capture("offer_tool_error", {
        tool_slug: "offer-clarity-check",
        analyzed_url: normalizedUrl,
        error: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Show clarity report if we have results
  if (result?.clarity) {
    const { clarity } = result;
    const domain = new URL(result.url).hostname;

    return (
      <div className="min-h-screen bg-white">
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
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="mb-2 text-3xl font-bold text-slate-900">
            Offer Clarity Report
          </h2>
          <p className="mb-8 text-slate-600">
            How clearly your store presents offers and what to improve
          </p>

          {/* Clarity score 0-10 */}
          <div className="mb-12">
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="py-8">
                <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm border border-blue-100">
                      <span className="text-4xl font-bold text-blue-700">
                        {clarity.score}
                      </span>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-900">
                        Clarity score
                      </p>
                      <p className="text-sm text-slate-600">
                        Out of 10 — based on offer visibility, shipping/returns messaging, and CTAs
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={clarity.score >= 7 ? "default" : "secondary"}
                    className={
                      clarity.score >= 7
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-amber-600 hover:bg-amber-700"
                    }
                  >
                    {clarity.score >= 8 ? "Strong" : clarity.score >= 6 ? "Good" : "Needs improvement"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Issues & strengths */}
          <div className="mb-12 grid gap-6 md:grid-cols-2">
            {clarity.issues.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader>
                  <CardTitle className="text-amber-900">Issues found</CardTitle>
                  <CardDescription>Areas that lower your clarity score</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {clarity.issues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {clarity.strengths.length > 0 && (
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="text-green-900">Strengths</CardTitle>
                  <CardDescription>What you&apos;re doing well</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {clarity.strengths.map((strength, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                        <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* AI-suggested fixes */}
          {clarity.suggestions.length > 0 && (
            <div className="mb-12">
              <h3 className="mb-4 text-xl font-semibold text-slate-900">
                Suggested improvements
              </h3>
              <p className="mb-6 text-sm text-slate-600">
                Actionable fixes tailored to your store (powered by AI)
              </p>
              <div className="space-y-4">
                {clarity.suggestions.map((fix, i) => (
                  <Card key={i} className="border-slate-200">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-900">{fix.title}</p>
                          <p className="mt-2 text-sm text-slate-600">{fix.description}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            fix.priority === "high"
                              ? "border-red-300 text-red-700"
                              : fix.priority === "medium"
                                ? "border-amber-300 text-amber-700"
                                : "border-slate-300 text-slate-600"
                          }
                        >
                          {fix.priority}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-8 text-center">
              <Sparkles className="mx-auto h-12 w-12 text-blue-600" />
              <h2 className="mt-4 text-2xl font-bold text-slate-900">
                Keep improving
              </h2>
              <p className="mt-3 text-slate-700">
                Re-run this check after you make changes to see your new score
              </p>
              <Button
                variant="outline"
                size="lg"
                className="mt-6"
                onClick={() => {
                  setResult(null);
                  setError(null);
                  setUrl(result.url);
                }}
              >
                Check again
              </Button>
            </CardContent>
          </Card>
        </div>
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
          <Link href="/free-tools/offer-clarity-check" className="hover:text-slate-900">
            Offer Clarity Checker
          </Link>
          <span>/</span>
          <span className="text-slate-900">Tool</span>
        </nav>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Offer Clarity Checker
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Score your store&apos;s offer visibility and get actionable improvements
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
                <CardTitle>Check your store</CardTitle>
                <CardDescription>
                  Enter your store URL to score offer visibility and get improvements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">Store URL</Label>
                    <Input
                      id="url"
                      type="text"
                      placeholder="your-store.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking clarity...
                      </>
                    ) : (
                      "Check clarity"
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
                  href="/free-tools/offer-clarity-check"
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  Learn more about Offer Clarity Checker
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
            {loading && <ClarityCheckProgress />}

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

            {!loading && !error && !result && (
              <Card className="border-2 border-dashed border-slate-200">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                    <CheckCircle className="h-8 w-8 text-slate-400" />
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
