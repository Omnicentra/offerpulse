import { redirect } from "next/navigation";
import { hasSubscribedWorkspaceAccess } from "@offerpulse/lib/constants";
import { getQueryClient, HydrateClient, trpc } from "@/src/lib/trpc/server";
import { StoreClient } from "./store-client";
import { getServerSession } from "@/src/server/auth/server-session";

export default async function StoreSettingsPage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/login");
  }

  const workspaceId = session.user.workspaceId;

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

  await queryClient.prefetchQuery(
    trpc.ownStore.get.queryOptions({ workspaceId })
  );

  return (
    <HydrateClient>
      <StoreClient
        isAdmin={session.user.role === "admin"}
        workspaceId={workspaceId}
        planId={subscription.planId}
      />
    </HydrateClient>
  );
}
