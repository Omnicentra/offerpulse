import { redirect } from "next/navigation";
import { hasSubscribedWorkspaceAccess } from "@offerpulse/lib/constants";
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
  const { workspaceId, role } = session.user;

  if (!workspaceId) {
    redirect("/login");
  }

  const subscription = await caller.billing.getSubscription();
  if (!subscription || !hasSubscribedWorkspaceAccess(subscription.status)) {
    redirect("/settings/billing");
  }

  const [initialSettings, initialProfile, initialStore, initialMembers] = await Promise.all([
    caller.workspaceSettings.get({ workspaceId }),
    caller.users.getProfile(),
    caller.ownStore.get({ workspaceId }),
    caller.users.list({ workspaceId }),
  ]);

  return (
    <SettingsClient
      workspaceId={workspaceId}
      initialSettings={initialSettings}
      planId={subscription.planId}
      userRole={role ?? "user"}
      initialProfile={initialProfile}
      initialStore={initialStore}
      initialMembers={initialMembers}
    />
  );
}
