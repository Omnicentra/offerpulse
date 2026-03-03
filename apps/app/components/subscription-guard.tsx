"use client";

import { useRouter } from "next/navigation";
import { useSubscription } from "@/src/providers/subscription-provider";
import { Button } from "@/components/ui/button";
import { AlertCircle, CreditCard, Loader2, Zap } from "lucide-react";

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { subscription, isLoading, isActive, isPastDue } = useSubscription();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!subscription || (!isActive && !isPastDue)) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Subscription required
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Choose a plan to access all OfferPulse features. Start with a 14-day free trial.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => router.push("/settings/billing")}>
              <Zap className="mr-2 h-4 w-4" />
              View plans
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isPastDue) {
    return (
      <>
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">
              Payment failed
            </p>
            <p className="text-xs text-red-700">
              Please update your payment method to avoid service interruption.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-100"
            onClick={() => router.push("/settings/billing")}
          >
            Update billing
          </Button>
        </div>
        {children}
      </>
    );
  }

  return <>{children}</>;
}
