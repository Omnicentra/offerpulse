"use client";

import { Button } from "@/components/ui/button";
import {
  TOUR_ID,
  captureDashboardTourCompleted,
  captureDashboardTourSkipped,
  captureDashboardTourStarted,
  captureDashboardTourStepAdvanced,
  captureDashboardTourStepViewed,
  stepKeyAtIndex,
} from "@/lib/dashboard-tour-analytics";
import { useTRPC } from "@/src/lib/trpc/client";
import { pendingTourStart$ } from "@/src/stores/tour-state";
import { use$ } from "@legendapp/state/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { SpotlightStep } from "react-tourlight";
import { SpotlightTour, useSpotlight } from "react-tourlight";

export { TOUR_ID } from "@/lib/dashboard-tour-analytics";

/**
 * Multi-page tour steps.
 *
 * Each step targets a sidebar nav item (always rendered) and includes:
 * - An `onAfterShow` callback that navigates to the related page
 *
 * Single step per page → no Back button (back would require cross-page navigation).
 *
 * Steps must stay referentially stable: `SpotlightTour` re-syncs when `steps` changes identity,
 * which clears active tour state and drops the tooltip after route transitions.
 */
function useStableTourSteps(): SpotlightStep[] {
  const pathname = usePathname();
  const router = useRouter();
  const pathnameRef = useRef(pathname);
  const routerRef = useRef(router);
  useLayoutEffect(() => {
    pathnameRef.current = pathname;
    routerRef.current = router;
  });

  return useMemo(
    () => [
      {
        target: '[data-tour="sidebar-logo"]',
        title: "Welcome to OfferPulse",
        content:
          "Your competitive intelligence hub. We'll walk you through the key features — it only takes a minute.",
        placement: "right" as const,
        spotlightPadding: 12,
        spotlightRadius: 12,
        onAfterShow: () => {
          const p = pathnameRef.current;
          if (p !== "/") routerRef.current.push("/");
        },
      },
      {
        target: '[data-tour="nav-competitors"]',
        title: "Track Competitors",
        content:
          "Add competitor URLs and OfferPulse automatically captures snapshots of their pages on your chosen schedule.",
        placement: "right" as const,
        spotlightPadding: 8,
        spotlightRadius: 10,
        onAfterShow: () => {
          const p = pathnameRef.current;
          if (!p.startsWith("/competitors")) routerRef.current.push("/competitors");
        },
      },
      {
        target: '[data-tour="nav-changes"]',
        title: "Detect Changes",
        content:
          "Every price drop, promo update, or copy change is detected and logged automatically — so you never miss a move.",
        placement: "right" as const,
        spotlightPadding: 8,
        spotlightRadius: 10,
        onAfterShow: () => {
          const p = pathnameRef.current;
          if (p !== "/changes") routerRef.current.push("/changes");
        },
      },
      {
        target: '[data-tour="nav-recommendations"]',
        title: "AI Recommendations",
        content:
          "Our AI analyzes competitor moves and surfaces concrete action items so you can respond with speed and confidence.",
        placement: "right" as const,
        spotlightPadding: 8,
        spotlightRadius: 10,
        onAfterShow: () => {
          const p = pathnameRef.current;
          if (p !== "/recommendations") routerRef.current.push("/recommendations");
        },
      },
      {
        target: '[data-tour="nav-alerts"]',
        title: "Stay Notified",
        content:
          "Configure email and Slack alerts to get pinged the moment a critical competitor change is detected.",
        placement: "right" as const,
        spotlightPadding: 8,
        spotlightRadius: 10,
        onAfterShow: () => {
          const p = pathnameRef.current;
          if (p !== "/alerts") routerRef.current.push("/alerts");
        },
      },
      {
        target: '[data-tour="nav-weekly-pulse"]',
        title: "Weekly Pulse",
        content:
          "Every Monday you'll receive a curated digest of the week's most important competitive intelligence, all in one report.",
        placement: "right" as const,
        spotlightPadding: 8,
        spotlightRadius: 10,
        onAfterShow: () => {
          const p = pathnameRef.current;
          if (p !== "/weekly-pulse") routerRef.current.push("/weekly-pulse");
        },
      },
    ],
    []
  );
}

function TourController() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { start, isActive, activeTourId, currentStep, totalSteps } = useSpotlight();
  const router = useRouter();
  const pathname = usePathname();
  const startedRef = useRef(false);
  const pendingStart = use$(pendingTourStart$);
  const lastLoggedStepRef = useRef<number | null>(null);

  const { data: profile, isSuccess } = useQuery({
    ...trpc.users.getProfile.queryOptions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const markTourSeenMutation = useMutation(
    trpc.users.markTourSeen.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.users.getProfile.queryFilter());
      },
    })
  );

  const markTourSeenMutateRef = useRef(markTourSeenMutation.mutate);
  useLayoutEffect(() => {
    markTourSeenMutateRef.current = markTourSeenMutation.mutate;
  });

  // Auto-start for first-time users (hasSeenTour === false in DB)
  useEffect(() => {
    if (!isSuccess || startedRef.current) return;
    if (profile.hasSeenTour) return;

    startedRef.current = true;
    const timer = setTimeout(() => {
      captureDashboardTourStarted("auto_first_visit");
      start(TOUR_ID);
    }, 900);
    return () => clearTimeout(timer);
  }, [isSuccess, profile?.hasSeenTour, start]);

  // Triggered restart from Settings (pendingTourStart$ === true)
  useEffect(() => {
    if (!pendingStart) return;
    pendingTourStart$.set(false);
    startedRef.current = true;

    // Navigate home first so the first step starts in the expected context.
    if (pathname !== "/") router.push("/");

    const timer = setTimeout(() => {
      captureDashboardTourStarted("settings_restart");
      start(TOUR_ID);
    }, 1200);
    return () => clearTimeout(timer);
  }, [pendingStart, start, pathname, router]);

  useEffect(() => {
    if (!isActive || activeTourId !== TOUR_ID) {
      lastLoggedStepRef.current = null;
      return;
    }
    if (totalSteps < 1) return;
    if (lastLoggedStepRef.current === currentStep) return;
    lastLoggedStepRef.current = currentStep;
    captureDashboardTourStepViewed({
      step_index: currentStep,
      step_key: stepKeyAtIndex(currentStep),
      total_steps: totalSteps,
    });
  }, [isActive, activeTourId, currentStep, totalSteps]);

  // Mark as seen when tour completes or is skipped
  // Must be referentially stable: SpotlightTour re-runs register/unregister when onComplete/onSkip change,
  // which would tear down an active tour mid-step.
  const handleComplete = useCallback(() => {
    captureDashboardTourCompleted();
    markTourSeenMutateRef.current({ seen: true });
  }, []);

  const handleSkip = useCallback((stepIndex: number) => {
    captureDashboardTourSkipped(stepIndex);
    markTourSeenMutateRef.current({ seen: true });
  }, []);

  const steps = useStableTourSteps();

  const renderTooltip = useCallback(
    ({
      step,
      next,
      skip,
      currentIndex,
      totalSteps,
    }: {
      step: SpotlightStep;
      next: () => void;
      skip: () => void;
      currentIndex: number;
      totalSteps: number;
    }) => (
      <div className="w-[22rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(11,18,32,0.12)]">
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

          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[hsl(var(--primary))] transition-all duration-500 ease-out"
              style={{ width: `${((currentIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <div className="px-5 pb-4">
          <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            {step.content as React.ReactNode}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <button
            onClick={skip}
            className="text-xs text-slate-400 transition-colors hover:text-slate-600"
          >
            Skip tour
          </button>

            <Button
              size="sm"
              onClick={() => {
                const isFinal = currentIndex >= totalSteps - 1;
                captureDashboardTourStepAdvanced({
                  from_step_index: currentIndex,
                  from_step_key: stepKeyAtIndex(currentIndex),
                  to_step_index: isFinal ? currentIndex : currentIndex + 1,
                  is_final_click: isFinal,
                });
                next();
              }}
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
    ),
    []
  );

  return (
    <SpotlightTour
      id={TOUR_ID}
      steps={steps}
      onComplete={handleComplete}
      onSkip={handleSkip}
      renderTooltip={renderTooltip}
    />
  );
}

export function OnboardingTour() {
  return <TourController />;
}
