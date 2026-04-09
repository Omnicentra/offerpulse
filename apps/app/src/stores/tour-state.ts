import { observable } from "@legendapp/state";
import { syncObservable } from "@legendapp/state/sync";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import type { TourState } from "react-tourlight";

const STORAGE_KEY = "offerpulse_tour_state_v1";

/**
 * Persisted tour progress — one entry per tour ID.
 * Synced to localStorage on client; empty during SSR.
 */
export const tourState$ = observable<Record<string, TourState>>({});

/**
 * Signal to trigger a fresh tour start (e.g. from Settings "Restart Tour").
 * Set to true to start the tour; OnboardingTour resets it to false after pickup.
 */
export const pendingTourStart$ = observable(false);

if (typeof window !== "undefined") {
  syncObservable(tourState$, {
    persist: {
      name: STORAGE_KEY,
      plugin: ObservablePersistLocalStorage,
    },
  });
}

export function updateTourState(tourId: string, state: TourState): void {
  console.log("updateTourState", tourId, state);
  tourState$.assign({ [tourId]: state });
}

export function clearTourState(): void {
  tourState$.set({});
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
