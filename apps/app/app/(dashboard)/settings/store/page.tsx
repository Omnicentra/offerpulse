import { redirect } from "next/navigation";
import { createCaller } from "@/src/lib/trpc/server";
import { StoreClient } from "./store-client";
import { auth } from "@/src/server/auth";
import { headers } from "next/headers";

export default async function StoreSettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const workspaceId = session.user.workspaceId;

  if (!workspaceId) {
    redirect("/login");
  }

  const caller = await createCaller();
  const subscription = await caller.billing.getSubscription();
  const isActive = ["active", "trialing"].includes(subscription?.status ?? "");
  if (!subscription || !isActive) {
    redirect("/settings/billing");
  }

  const initialStore = await caller.ownStore.get({ workspaceId });

  return (
    <StoreClient
      workspaceId={workspaceId}
      initialStore={initialStore}
      planId={subscription.planId}
    />
  );
}
