import { redirect } from "next/navigation";
import { getQueryClient, HydrateClient, trpc } from "@/src/lib/trpc/server";
import { getServerSession } from "@/src/server/auth/server-session";
import { ChangesPageClient } from "./changes-page-client";

export default async function ChangesPage() {
  const session = await getServerSession();

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
