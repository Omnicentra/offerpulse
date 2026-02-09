"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { competitorsApi, snapshotsApi } from "@/src/mock/api";
import { ArrowLeft, Check, CreditCard } from "lucide-react";

export default function BillingPage() {
  const router = useRouter();

  const { data: competitors } = useQuery({
    queryKey: ["competitors"],
    queryFn: () => competitorsApi.list(),
  });

  const { data: snapshots } = useQuery({
    queryKey: ["snapshots"],
    queryFn: () => snapshotsApi.list(),
  });

  const activeCompetitors = competitors?.filter((c) => c.isActive).length || 0;
  
  // Count snapshots from current month
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const snapshotsThisMonth = snapshots?.filter(
    (s) => new Date(s.capturedAt) >= firstDayOfMonth
  ).length || 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/settings")}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Button>

        <PageHeader
          title="Billing & Plan"
          description="Manage your subscription and view usage"
        />
      </div>

      {/* Current Plan */}
      <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
        <div className="flex items-start justify-between">
          <div>
            <Badge className="mb-3">Current Plan</Badge>
            <h2 className="text-3xl font-bold text-slate-900">Trial</h2>
            <p className="mt-2 text-lg text-slate-700">Free Demo Mode</p>
            <p className="mt-1 text-sm text-slate-600">
              Unlimited access to all features in demo mode
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600">
            <CreditCard className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-6 text-lg font-semibold text-slate-900">Usage This Month</h3>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-slate-600">Competitors Tracked</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{activeCompetitors}</p>
            <p className="mt-1 text-sm text-slate-500">Active monitors</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">Snapshots Captured</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{snapshotsThisMonth}</p>
            <p className="mt-1 text-sm text-slate-500">This billing period</p>
          </div>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Available Plans</h3>
        
        <div className="grid gap-6 md:grid-cols-3">
          {/* Starter */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h4 className="text-lg font-semibold text-slate-900">Starter</h4>
            <p className="mt-2 text-sm text-slate-600">For small businesses</p>
            <div className="mt-4">
              <span className="text-4xl font-bold text-slate-900">$49</span>
              <span className="text-slate-600">/month</span>
            </div>
            <ul className="mt-6 space-y-3">
              {[
                "Up to 5 competitors",
                "Daily snapshots",
                "Email alerts",
                "Basic recommendations",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="h-5 w-5 flex-shrink-0 text-green-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="mt-6 w-full" disabled>
              Current Plan
            </Button>
          </div>

          {/* Pro */}
          <div className="rounded-2xl border-2 border-blue-600 bg-white p-6 relative">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Popular</Badge>
            <h4 className="text-lg font-semibold text-slate-900">Pro</h4>
            <p className="mt-2 text-sm text-slate-600">For growing teams</p>
            <div className="mt-4">
              <span className="text-4xl font-bold text-slate-900">$149</span>
              <span className="text-slate-600">/month</span>
            </div>
            <ul className="mt-6 space-y-3">
              {[
                "Up to 20 competitors",
                "6-hour snapshots",
                "Slack + Email alerts",
                "Advanced recommendations",
                "Weekly pulse reports",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="h-5 w-5 flex-shrink-0 text-green-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button className="mt-6 w-full" disabled>
              Upgrade to Pro
            </Button>
          </div>

          {/* Enterprise */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h4 className="text-lg font-semibold text-slate-900">Enterprise</h4>
            <p className="mt-2 text-sm text-slate-600">For large organizations</p>
            <div className="mt-4">
              <span className="text-4xl font-bold text-slate-900">Custom</span>
            </div>
            <ul className="mt-6 space-y-3">
              {[
                "Unlimited competitors",
                "Hourly snapshots",
                "Priority support",
                "Custom integrations",
                "Dedicated account manager",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="h-5 w-5 flex-shrink-0 text-green-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="mt-6 w-full" disabled>
              Contact Sales
            </Button>
          </div>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h3 className="text-sm font-semibold text-slate-900">Demo Mode</h3>
        <p className="mt-2 text-sm text-slate-600">
          You're currently using OfferPulse in demo mode with full access to all features. In a production
          environment, billing would be handled through Stripe or a similar payment processor.
        </p>
      </div>
    </div>
  );
}
