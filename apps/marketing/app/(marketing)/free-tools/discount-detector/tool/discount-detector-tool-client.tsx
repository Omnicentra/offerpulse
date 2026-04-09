"use client";

import type {
  DetectedDiscountOffer,
  DiscountDetectorResponse,
} from "@/app/api/tools/discount-detector/route";
import { Container } from "@/components/container";
import { DiscountDetectorProgress } from "@/components/snapshot-report/DiscountDetectorProgress";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { normalizeUrl, validateUrl } from "@/lib/url-helpers";
import {
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Loader2,
  Package,
  Percent,
  PoundSterling,
  Sparkles,
  Tag,
} from "lucide-react";
import Link from "next/link";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";

interface DiscountDetectorToolClientProps {
  urlParam: string | null;
}

function isPercentageOffer(
  o: DetectedDiscountOffer,
): o is Extract<DetectedDiscountOffer, { kind: "percentage" }> {
  return o.kind === "percentage";
}

function isFixedOffer(
  o: DetectedDiscountOffer,
): o is Extract<DetectedDiscountOffer, { kind: "fixed_amount" }> {
  return o.kind === "fixed_amount";
}

function isBundleHint(
  o: DetectedDiscountOffer,
): o is Extract<DetectedDiscountOffer, { kind: "bundle_hint" }> {
  return o.kind === "bundle_hint";
}

function OfferRow({
  evidenceText,
  locationHint,
  subtitle,
  sourceUrl,
}: {
  evidenceText: string;
  locationHint: string;
  subtitle?: string;
  sourceUrl?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
      <p className="font-medium text-slate-900">{evidenceText}</p>
      {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-xs font-normal">
          {locationHint}
        </Badge>
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-violet-600 hover:underline"
          >
            View page
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function DiscountDetectorToolClient({ urlParam }: DiscountDetectorToolClientProps) {
  const hasAutoRun = useRef(false);

  const [url, setUrl] = useState(urlParam || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiscountDetectorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (urlParam && !hasAutoRun.current && !result && !loading) {
      hasAutoRun.current = true;
      void handleSubmit(new Event("submit") as unknown as React.FormEvent);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- single auto-run from ?url= only
  }, [urlParam]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const normalizedUrl = normalizeUrl(url);
    const validation = validateUrl(url);

    if (!validation.ok || !normalizedUrl) {
      setError(validation.reason || "Enter a valid store URL (e.g. brand.com)");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/tools/discount-detector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      const data = (await response.json()) as DiscountDetectorResponse & {
        error?: string;
        resetAt?: string;
      };

      if (!response.ok) {
        let msg = data.error || "Failed to analyse store";
        if (response.status === 429 && data.resetAt) {
          msg += ` Try again after ${new Date(data.resetAt).toLocaleString()}.`;
        }
        throw new Error(msg);
      }

      setResult(data);

      const kinds = new Set(data.offers.map((o) => o.kind));
      posthog.capture("offer_tool_analyzed", {
        tool_slug: "discount-detector",
        analyzed_url: normalizedUrl,
        offers_found: data.offers.length,
        summary_percentage: data.summary.percentageCount,
        summary_fixed: data.summary.fixedAmountCount,
        summary_bundle_hints: data.summary.bundleHintCount,
        has_percentage: kinds.has("percentage"),
        has_fixed_amount: kinds.has("fixed_amount"),
        has_bundle_hint: kinds.has("bundle_hint"),
        schema_version: data.schemaVersion,
        page_screenshots_count: data.pageScreenshots?.length ?? 0,
        warnings_count: data.warnings?.length ?? 0,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);

      posthog.capture("offer_tool_error", {
        tool_slug: "discount-detector",
        analyzed_url: normalizedUrl,
        error: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    const domain = new URL(result.url).hostname;
    const percentages = result.offers.filter(isPercentageOffer);
    const fixed = result.offers.filter(isFixedOffer);
    const bundles = result.offers.filter(isBundleHint);

    return (
      <div className="min-h-screen bg-white">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element -- external favicon URL */}
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                    alt=""
                    className="h-6 w-6"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{domain}</div>
                  <div className="text-xs text-slate-500">
                    Scanned {new Date(result.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setResult(null);
                  setError(null);
                  setUrl(result.url);
                }}
              >
                Scan again
              </Button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="mb-2 text-3xl font-bold text-slate-900">Discount report</h2>
          <p className="mb-4 text-slate-600">
            We map public storefront URLs, scrape prioritized pages, and scan HTML for visible
            percentage-off messaging, fixed-amount deals, and bundle-style copy. Cart-only or
            checkout-only offers may not appear.
          </p>

          {result.warnings.length > 0 ? (
            <Card className="mb-8 border-amber-200 bg-amber-50/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-amber-950">Notes</CardTitle>
                <CardDescription className="text-amber-900/80">
                  Schema v{result.schemaVersion}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-inside list-disc space-y-1 text-sm text-amber-950">
                  {result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-violet-100 bg-violet-50/50">
              <CardContent className="flex items-center gap-3 pt-6">
                <Percent className="h-8 w-8 text-violet-600" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{result.summary.percentageCount}</p>
                  <p className="text-sm text-slate-600">Percentage offers</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-emerald-100 bg-emerald-50/50">
              <CardContent className="flex items-center gap-3 pt-6">
                <PoundSterling className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{result.summary.fixedAmountCount}</p>
                  <p className="text-sm text-slate-600">Fixed amount off</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-amber-100 bg-amber-50/50">
              <CardContent className="flex items-center gap-3 pt-6">
                <Package className="h-8 w-8 text-amber-600" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{result.summary.bundleHintCount}</p>
                  <p className="text-sm text-slate-600">Bundle / BOGO hints</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-10">
            <h3 className="mb-4 text-xl font-semibold text-slate-900">Offers</h3>
            <Tabs defaultValue="percentage" className="w-full">
              <TabsList className="grid w-full max-w-lg grid-cols-3">
                <TabsTrigger value="percentage">%</TabsTrigger>
                <TabsTrigger value="fixed">Fixed</TabsTrigger>
                <TabsTrigger value="bundle">Bundles</TabsTrigger>
              </TabsList>
              <TabsContent value="percentage" className="mt-4 space-y-3">
                {percentages.length === 0 ? (
                  <p className="text-sm text-slate-500">No percentage discounts detected.</p>
                ) : (
                  percentages.map((o, i) => (
                    <OfferRow
                      key={`p-${i}`}
                      evidenceText={o.evidenceText}
                      locationHint={o.locationHint}
                      sourceUrl={o.sourceUrl}
                    />
                  ))
                )}
              </TabsContent>
              <TabsContent value="fixed" className="mt-4 space-y-3">
                {fixed.length === 0 ? (
                  <p className="text-sm text-slate-500">No fixed-amount discounts detected.</p>
                ) : (
                  fixed.map((o, i) => (
                    <OfferRow
                      key={`f-${i}`}
                      evidenceText={o.evidenceText}
                      locationHint={o.locationHint}
                      subtitle={`Parsed amount: ${o.currency}${o.value}`}
                      sourceUrl={o.sourceUrl}
                    />
                  ))
                )}
              </TabsContent>
              <TabsContent value="bundle" className="mt-4 space-y-3">
                {bundles.length === 0 ? (
                  <p className="text-sm text-slate-500">No bundle or BOGO-style hints detected.</p>
                ) : (
                  bundles.map((o, i) => (
                    <OfferRow
                      key={`b-${i}`}
                      evidenceText={o.evidenceText}
                      locationHint={o.locationHint}
                      sourceUrl={o.sourceUrl}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>

          {result.pageScreenshots.length > 0 ? (
            <div className="mb-10">
              <h3 className="mb-4 text-xl font-semibold text-slate-900">Page captures</h3>
              <p className="mb-4 text-sm text-slate-600">
                Viewport screenshots from key same-origin pages (evidence only; layout may differ from
                what you see in-browser).
              </p>
              <div className="grid gap-6 sm:grid-cols-2">
                {result.pageScreenshots.map((shot, i) => (
                  <Card key={`${shot.url}-${i}`} className="overflow-hidden border-slate-200">
                    <CardHeader className="border-b border-slate-100 py-3">
                      <CardTitle className="text-sm font-medium text-slate-800">
                        <a
                          href={shot.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:text-violet-700"
                        >
                          {(() => {
                            try {
                              return new URL(shot.url).pathname || "/";
                            } catch {
                              return shot.url;
                            }
                          })()}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </CardTitle>
                      {shot.error ? (
                        <CardDescription className="text-amber-700">{shot.error}</CardDescription>
                      ) : null}
                    </CardHeader>
                    <CardContent className="p-0">
                      {shot.screenshotUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element -- Firecrawl-hosted screenshot URLs vary by host */
                        <img
                          src={shot.screenshotUrl}
                          alt={`Screenshot of ${shot.url}`}
                          className="h-auto w-full object-top"
                        />
                      ) : (
                        <div className="bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                          No image
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : null}

          <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50">
            <CardContent className="p-8 text-center">
              <Sparkles className="mx-auto h-12 w-12 text-violet-600" />
              <h2 className="mt-4 text-2xl font-bold text-slate-900">Monitor competitors automatically</h2>
              <p className="mt-3 text-slate-700">
                Get alerts when competitor discounts and offers change — no manual rescans.
              </p>
              <Button asChild size="lg" className="mt-6">
                <Link href="/">Start monitoring</Link>
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
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-600">
          <Link href="/free-tools" className="hover:text-slate-900">
            Free tools
          </Link>
          <span>/</span>
          <Link href="/free-tools/discount-detector" className="hover:text-slate-900">
            Discount Detector
          </Link>
          <span>/</span>
          <span className="text-slate-900">Tool</span>
        </nav>

        <div className="mb-12">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">
              <Percent className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Discount Detector</h1>
              <p className="mt-1 text-sm text-slate-600">
                Detect visible discount messaging by mapping the site and analysing public HTML
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analyse a store</CardTitle>
                <CardDescription>
                  Enter a competitor or your own storefront URL. Public pages only.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">Store URL</Label>
                    <Input
                      id="url"
                      type="text"
                      placeholder="competitor.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scanning…
                      </>
                    ) : (
                      "Detect discounts"
                    )}
                  </Button>
                </form>

                <p className="mt-4 text-xs text-slate-500">
                  Some stores block automated access. Email-only codes won&apos;t appear unless advertised
                  on the page. For public research only.
                </p>
              </CardContent>
            </Card>

            <Card className="border-violet-200 bg-violet-50">
              <CardHeader>
                <CardTitle className="text-base">About this tool</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-700">
                <Link
                  href="/free-tools/discount-detector"
                  className="flex items-center gap-2 text-violet-700 hover:underline"
                >
                  Learn more about Discount Detector
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          </div>

          <div>
            {loading && <DiscountDetectorProgress />}

            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="flex items-start gap-3 pt-6">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-900">Scan failed</p>
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
                    <Tag className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="mt-4 font-medium text-slate-900">Enter a URL to get started</p>
                  <p className="mt-1 text-sm text-slate-600">Results will appear here after the scan</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
