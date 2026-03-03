"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSubscription } from "@/src/providers/subscription-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertCircle, Loader2, Zap } from "lucide-react";

const BILLING_PATH = "/settings/billing";

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { subscription, isLoading, isActive, isPastDue } = useSubscription();
  const router = useRouter();

  const isOnBillingPage = pathname === BILLING_PATH;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!subscription || (!isActive && !isPastDue)) {
    if (isOnBillingPage) {
      return <>{children}</>;
    }
    return (
      <>
        {children}
        <Dialog open>
          <DialogContent
            showClose={false}
            overlayClassName="bg-ink/60 backdrop-blur-md"
            className="max-w-md border-0 bg-white p-0 shadow-2xl shadow-slate-900/20 ring-1 ring-slate-200/80 sm:rounded-3xl"
          >
            <div className="p-8 sm:p-10">
              <DialogHeader className="space-y-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(243,95%,58%)] shadow-lg shadow-[hsl(var(--primary))]/25">
                  <Zap className="h-8 w-8 text-white" strokeWidth={2.5} />
                </div>
                <div className="space-y-2">
                  <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900">
                    Subscription required
                  </DialogTitle>
                  <DialogDescription className="text-base text-slate-600">
                    Choose a plan to access all OfferPulse features. Start with a 14-day free trial—no charge until then.
                  </DialogDescription>
                </div>
              </DialogHeader>
              <DialogFooter className="mt-8 flex flex-col gap-3 sm:flex-col">
                <Button
                  size="lg"
                  className="w-full bg-[hsl(var(--primary))] font-semibold hover:bg-[hsl(var(--primary-dark))]"
                  onClick={() => router.push("/settings/billing")}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  View plans
                </Button>
                <p className="text-center text-xs text-slate-500">
                  You’ll need an active plan to use the dashboard.
                </p>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </>
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
