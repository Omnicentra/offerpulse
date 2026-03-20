"use client";

import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import Link from "next/link";

interface UpgradePromptProps {
  feature: string;
  requiredPlan: string;
}

export function UpgradePrompt({ feature, requiredPlan }: UpgradePromptProps) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100">
          <Lock className="h-6 w-6 text-slate-500" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {feature} requires {requiredPlan}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Upgrade your plan to unlock this feature and connect your Shopify store for automated sync.
          </p>
          <Button asChild className="mt-4">
            <Link href="/settings/billing">Upgrade plan</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
