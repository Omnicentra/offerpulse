"use client";

import { useEffect } from "react";
import { SpotlightTour, useSpotlight } from "react-tourlight";
import type { SpotlightStep } from "react-tourlight";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Sparkles, X } from "lucide-react";

export const TOUR_ID = "dashboard-tour";
export const TOUR_STORAGE_KEY = "offerpulse_tour_v1_completed";

const tourSteps: SpotlightStep[] = [
  {
    target: '[data-tour="sidebar-logo"]',
    title: "Welcome to OfferPulse",
    content:
      "Your competitive intelligence hub. We'll walk you through the key areas of the dashboard — it only takes a minute.",
    placement: "right",
    spotlightPadding: 12,
    spotlightRadius: 12,
  },
  {
    target: '[data-tour="nav-competitors"]',
    title: "Track Competitors",
    content:
      "Add competitor URLs and OfferPulse automatically captures snapshots of their pages on your chosen schedule.",
    placement: "right",
    spotlightPadding: 8,
    spotlightRadius: 10,
  },
  {
    target: '[data-tour="nav-changes"]',
    title: "Detect Changes",
    content:
      "Every price drop, promo update, or copy change is detected and logged — so you never miss a competitive move.",
    placement: "right",
    spotlightPadding: 8,
    spotlightRadius: 10,
  },
  {
    target: '[data-tour="nav-recommendations"]',
    title: "AI Recommendations",
    content:
      "Our AI analyzes competitor moves and surfaces concrete action items, so you can respond with speed and confidence.",
    placement: "right",
    spotlightPadding: 8,
    spotlightRadius: 10,
  },
  {
    target: '[data-tour="nav-alerts"]',
    title: "Stay Notified",
    content:
      "Configure email and Slack alerts to get pinged the moment a critical competitor change is detected.",
    placement: "right",
    spotlightPadding: 8,
    spotlightRadius: 10,
  },
  {
    target: '[data-tour="nav-weekly-pulse"]',
    title: "Weekly Pulse",
    content:
      "Every Monday you'll receive a curated digest of the week's most important competitive intelligence, all in one report.",
    placement: "right",
    spotlightPadding: 8,
    spotlightRadius: 10,
  },
];

function TourAutoStart() {
  const { start } = useSpotlight();

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => start(TOUR_ID), 900);
      return () => clearTimeout(timer);
    }
  }, [start]);

  return null;
}

export function OnboardingTour() {
  const handleDone = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
  };

  return (
    <>
      <TourAutoStart />
      <SpotlightTour
        id={TOUR_ID}
        steps={tourSteps}
        onComplete={handleDone}
        onSkip={handleDone}
        renderTooltip={({ step, next, previous, skip, currentIndex, totalSteps }) => (
          <div className="w-[22rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(11,18,32,0.12)]">
            {/* Header */}
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--primary-tint))]">
                    <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                  </div>
                  <span className="text-xs font-medium text-slate-400">
                    Step {currentIndex + 1} of {totalSteps}
                  </span>
                </div>
                <button
                  onClick={skip}
                  className="rounded-md p-1 text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-500"
                  aria-label="Close tour"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[hsl(var(--primary))] transition-all duration-500 ease-out"
                  style={{ width: `${((currentIndex + 1) / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            {/* Body */}
            <div className="px-5 pb-4">
              <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                {step.content as React.ReactNode}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <button
                onClick={skip}
                className="text-xs text-slate-400 transition-colors hover:text-slate-600"
              >
                Skip tour
              </button>

              <div className="flex items-center gap-2">
                {currentIndex > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={previous}
                    className="h-8 gap-1 px-3 text-xs"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Back
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={next}
                  className="h-8 gap-1 px-3 text-xs"
                >
                  {currentIndex < totalSteps - 1 ? (
                    <>
                      Next
                      <ArrowRight className="h-3 w-3" />
                    </>
                  ) : (
                    "Get started"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      />
    </>
  );
}
