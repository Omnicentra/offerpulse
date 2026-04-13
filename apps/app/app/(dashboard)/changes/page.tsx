import { redirect } from "next/navigation";
import { getQueryClient, HydrateClient, trpc } from "@/src/lib/trpc/server";
import { auth } from "@/src/server/auth";
import { headers } from "next/headers";
import { ChangesPageClient } from "./changes-page-client";

export default async function ChangesPage() {
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
  await Promise.all([
    queryClient.prefetchQuery(
      trpc.competitors.list.queryOptions({ workspaceId })
    ),
    queryClient.prefetchQuery(
      trpc.changeEvents.list.queryOptions({ workspaceId })
    ),
  ]);

  return (
    <HydrateClient>
      <ChangesPageClient workspaceId={workspaceId} />
    </HydrateClient>
  );
}
