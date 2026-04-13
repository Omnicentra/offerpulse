import { redirect } from "next/navigation";
import { hasSubscribedWorkspaceAccess } from "@offerpulse/lib/constants";
import { getQueryClient, HydrateClient, trpc } from "@/src/lib/trpc/server";
import { SettingsClient } from "./settings-client";
import { getServerSession } from "@/src/server/auth/server-session";

export default async function SettingsPage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/login");
  }

  const { workspaceId, role } = session.user;

  if (!workspaceId) {
    redirect("/login");
  }

  const queryClient = getQueryClient();
  const subscription = await queryClient.fetchQuery(
    trpc.billing.getSubscription.queryOptions()
  );
  if (!subscription || !hasSubscribedWorkspaceAccess(subscription.status)) {
    redirect("/settings/billing");
  }

  await Promise.all([
    queryClient.prefetchQuery(
      trpc.workspaceSettings.get.queryOptions({ workspaceId })
    ),
    queryClient.prefetchQuery(trpc.users.getProfile.queryOptions()),
    queryClient.prefetchQuery(trpc.ownStore.get.queryOptions({ workspaceId })),
    queryClient.prefetchQuery(trpc.users.list.queryOptions({ workspaceId })),
  ]);

  return (
    <HydrateClient>
      <SettingsClient
        workspaceId={workspaceId}
        planId={subscription.planId}
        userRole={role ?? "user"}
      />
    </HydrateClient>
  );
}
