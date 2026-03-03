"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTRPC, useTRPCClient } from "@/src/lib/trpc/client";
import { useWorkspace } from "@/src/providers/workspace-provider";
import { useToast } from "@/hooks/use-toast";
import {
  PRICING_PLANS,
  formatPrice,
  type PricingPlan,
} from "@offerpulse/lib/pricing";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Loader2,
  AlertCircle,
  Calendar,
  Zap,
} from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  trialing: { label: "Trial", variant: "secondary" },
  past_due: { label: "Past Due", variant: "destructive" },
  canceled: { label: "Canceled", variant: "outline" },
  incomplete: { label: "Incomplete", variant: "outline" },
};

export default function BillingPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { workspaces } = useWorkspace();

  const { data: subscription, isLoading } = useQuery(
    trpc.billing.getSubscription.queryOptions()
  );

  const cancelMutation = useMutation(
    trpc.billing.cancelSubscription.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.billing.getSubscription.queryKey() });
        toast({ title: "Subscription cancelled", description: "Your plan will remain active until the end of the billing period." });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    })
  );

  const reactivateMutation = useMutation(
    trpc.billing.reactivateSubscription.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.billing.getSubscription.queryKey() });
        toast({ title: "Subscription reactivated", description: "Your plan will continue as normal." });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    })
  );

  const handlePortal = async () => {
    try {
      const { url } = await trpcClient.billing.createPortalSession.mutate({
        returnUrl: window.location.href,
      });
      window.location.href = url;
    } catch {
      toast({ title: "Error", description: "Could not open billing portal.", variant: "destructive" });
    }
  };

  const handleUpgrade = async (plan: PricingPlan) => {
    try {
      const { sessionUrl } = await trpcClient.billing.createCheckoutSession.mutate({
        lookupKey: plan.stripeLookupKeyMonthly,
      });
      window.location.href = sessionUrl;
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Could not start checkout.",
        variant: "destructive",
      });
    }
  };

  const statusInfo = subscription
    ? STATUS_LABELS[subscription.status] ?? { label: subscription.status, variant: "outline" as const }
    : null;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <Button variant="ghost" size="sm" onClick={() => router.push("/settings")} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Settings
        </Button>
        <PageHeader title="Billing & Plan" description="Manage your subscription and view usage" />
        <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.push("/settings")} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Settings
        </Button>
        <PageHeader title="Billing & Plan" description="Manage your subscription and view usage" />
      </div>

      {/* Current plan */}
      {subscription ? (
        <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Badge>Current Plan</Badge>
                <Badge variant={statusInfo?.variant}>{statusInfo?.label}</Badge>
                {subscription.cancelAtPeriodEnd && (
                  <Badge variant="outline" className="border-amber-300 text-amber-700">
                    Cancelling
                  </Badge>
                )}
              </div>
              <h2 className="text-3xl font-bold text-slate-900">
                {subscription.plan?.name ?? subscription.planId}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {subscription.interval === "year" ? "Yearly" : "Monthly"} billing
              </p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Dates */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {subscription.status === "trialing" && subscription.trialEnd && (
              <div className="flex items-start gap-3">
                <Zap className="mt-0.5 h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Trial ends</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {new Date(subscription.trialEnd).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs font-medium text-slate-500">
                  {subscription.cancelAtPeriodEnd ? "Access until" : "Next billing date"}
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Past due warning */}
          {subscription.status === "past_due" && (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-900">Payment failed</p>
                <p className="text-xs text-red-700">Please update your payment method to avoid interruption.</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="outline" onClick={handlePortal}>
              Manage payment method
            </Button>
            {subscription.cancelAtPeriodEnd ? (
              <Button
                variant="outline"
                onClick={() => reactivateMutation.mutate()}
                disabled={reactivateMutation.isPending}
              >
                {reactivateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Reactivate subscription
              </Button>
            ) : (
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Cancel subscription
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-amber-500" />
          <h2 className="mt-4 text-xl font-bold text-slate-900">No active subscription</h2>
          <p className="mt-1 text-sm text-slate-600">Choose a plan below to get started.</p>
        </div>
      )}

      {/* Usage — only show when subscribed to a plan */}
      {subscription?.plan && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-semibold text-slate-900">Usage</h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-slate-600">Workspaces</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {workspaces.length}
                <span className="text-lg font-normal text-slate-500">
                  /{subscription.plan.maxWorkspaces}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Plan</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {subscription.plan.name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Available plans */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Available Plans</h3>
        <div className="grid gap-6 md:grid-cols-3">
          {PRICING_PLANS.map((plan) => {
            const isCurrent = subscription?.planId === plan.id;
            return (
              <div
                key={plan.id}
                className={`rounded-2xl border p-6 ${
                  isCurrent ? "border-2 border-blue-600 bg-blue-50/30" : "border-slate-200 bg-white"
                }`}
              >
                {plan.popular && (
                  <Badge className="mb-3">Popular</Badge>
                )}
                <h4 className="text-lg font-semibold text-slate-900">{plan.name}</h4>
                <p className="mt-1 text-sm text-slate-600">{plan.tagline}</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-slate-900">
                    {formatPrice(plan.monthlyPrice)}
                  </span>
                  <span className="text-slate-600">/mo</span>
                </div>
                <ul className="mt-5 space-y-2">
                  {plan.features
                    .filter((f) => f.included)
                    .slice(0, 4)
                    .map((feature) => (
                      <li key={feature.text} className="flex items-start gap-2 text-sm text-slate-700">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                        <span>{feature.text}</span>
                      </li>
                    ))}
                </ul>
                <Button
                  variant={isCurrent ? "outline" : "default"}
                  className="mt-6 w-full"
                  disabled={isCurrent}
                  onClick={() => !isCurrent && handleUpgrade(plan)}
                >
                  {isCurrent ? "Current Plan" : "Upgrade"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
