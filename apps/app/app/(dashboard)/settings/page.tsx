import { redirect } from "next/navigation";
import { createCaller } from "@/src/lib/trpc/server";
import { SettingsClient } from "./settings-client";
import { auth } from "@/src/server/auth";
import { headers } from "next/headers";

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const caller = await createCaller();
  const workspaceId = session.user.workspaceId;

  if (!workspaceId) {
    redirect("/login");
  }

  // Require active subscription before calling workspace procedures
  const subscription = await caller.billing.getSubscription();
  const isActive = ["active", "trialing"].includes(subscription?.status ?? "");
  if (!subscription || !isActive) {
    redirect("/settings/billing");
  }

  const initialSettings = await caller.workspaceSettings.get({ workspaceId });

  return (
    <SettingsClient
      workspaceId={workspaceId}
      initialSettings={initialSettings}
    />
  );
}
