"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Zap } from "lucide-react";

function isSubscriptionRequiredError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : String(error);
  return (
    message.includes("active subscription") ||
    message.includes("subscription is required") ||
    message.includes("Subscription expired")
  );
}

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const showSubscriptionCTA = isSubscriptionRequiredError(error);

  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  if (showSubscriptionCTA) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <CreditCard className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Subscription required
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            You need an active subscription to use this feature. Subscribe or
            renew to continue.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              onClick={() => window.location.assign("/settings/billing")}
            >
              <Zap className="mr-2 h-4 w-4" />
              View plans & subscribe
            </Button>
            <Button variant="outline" size="lg" onClick={reset}>
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isProduction = process.env.NODE_ENV === "production";

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-slate-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-600">
          {isProduction
            ? "We couldn’t load this page. You can try again. If the problem continues, contact support and share the reference below."
            : (error.message ?? "An unexpected error occurred.")}
        </p>
        {isProduction && error.digest ? (
          <p className="mt-3 font-mono text-xs text-slate-500">
            Reference: {error.digest}
          </p>
        ) : null}
        <Button className="mt-8" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
