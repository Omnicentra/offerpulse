"use client";

import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/src/lib/trpc/client";
import { useSession } from "../server/auth/client";
import type { PricingPlan, PlanId } from "@offerpulse/lib/pricing";
import { getPlanById } from "@offerpulse/lib/pricing";

interface SubscriptionData {
  id: string;
  planId: string;
  status: string;
  interval: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | Date;
  trialEnd: string | Date | null;
  plan: PricingPlan | null;
}

interface SubscriptionContextType {
  subscription: SubscriptionData | null;
  isLoading: boolean;
  isActive: boolean;
  isTrialing: boolean;
  isPastDue: boolean;
  plan: PricingPlan | null;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  isLoading: true,
  isActive: false,
  isTrialing: false,
  isPastDue: false,
  plan: null,
});

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const trpc = useTRPC();

  const { data: subscription, isLoading } = useQuery(
    trpc.billing.getSubscription.queryOptions(undefined, {
      enabled: !!session?.user,
      staleTime: 60_000,
    })
  );

  const plan = subscription
    ? getPlanById(subscription.planId as PlanId) ?? null
    : null;

  const isActive = subscription?.status === "active" || subscription?.status === "trialing";
  const isTrialing = subscription?.status === "trialing";
  const isPastDue = subscription?.status === "past_due";

  return (
    <SubscriptionContext.Provider
      value={{
        subscription: subscription ?? null,
        isLoading: !!session?.user && isLoading,
        isActive,
        isTrialing,
        isPastDue,
        plan,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return context;
}
