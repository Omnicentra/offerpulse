import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/src/server/auth";
import { getQueryClient, HydrateClient, trpc } from "@/src/lib/trpc/server";
import { AlertsPageClient } from "./alerts-page-client";

export default async function AlertsPage() {
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

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(
    trpc.alerts.get.queryOptions({ workspaceId })
  );

  return (
    <HydrateClient>
      <AlertsPageClient workspaceId={workspaceId} />
    </HydrateClient>
  );
}
