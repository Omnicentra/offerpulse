import posthog from "posthog-js";

/** Must match `SpotlightTour` id in `OnboardingTour`. */
export const TOUR_ID = "dashboard-tour";

/** Stable keys for each step (order matches `useStableTourSteps`). */
export const DASHBOARD_TOUR_STEP_KEYS = [
  "welcome",
  "competitors",
  "changes",
  "recommendations",
  "alerts",
  "weekly_pulse",
] as const;

export type DashboardTourStartSource = "auto_first_visit" | "settings_restart";

function safeCapture(event: string, properties: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  posthog.capture(event, properties);
}

export function captureDashboardTourStarted(source: DashboardTourStartSource) {
  safeCapture("dashboard_tour_started", {
    tour_id: TOUR_ID,
    source,
  });
}

export function captureDashboardTourStepViewed(payload: {
  step_index: number;
  step_key: string;
  total_steps: number;
}) {
  safeCapture("dashboard_tour_step_viewed", {
    tour_id: TOUR_ID,
    ...payload,
  });
}

export function captureDashboardTourStepAdvanced(payload: {
  from_step_index: number;
  from_step_key: string;
  to_step_index: number;
  is_final_click: boolean;
}) {
  safeCapture("dashboard_tour_step_advanced", {
    tour_id: TOUR_ID,
    ...payload,
  });
}

export function captureDashboardTourCompleted() {
  safeCapture("dashboard_tour_completed", {
    tour_id: TOUR_ID,
    total_steps: DASHBOARD_TOUR_STEP_KEYS.length,
  });
}

export function captureDashboardTourSkipped(stepIndex: number) {
  const stepKey =
    DASHBOARD_TOUR_STEP_KEYS[stepIndex] ?? `step_${stepIndex}`;
  safeCapture("dashboard_tour_skipped", {
    tour_id: TOUR_ID,
    step_index: stepIndex,
    step_key: stepKey,
    total_steps: DASHBOARD_TOUR_STEP_KEYS.length,
  });
}

export function stepKeyAtIndex(index: number): string {
  return DASHBOARD_TOUR_STEP_KEYS[index] ?? `step_${index}`;
}
