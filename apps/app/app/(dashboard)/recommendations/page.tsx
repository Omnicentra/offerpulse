import { redirect } from "next/navigation";
import { getQueryClient, HydrateClient, trpc } from "@/src/lib/trpc/server";
import { getServerSession } from "@/src/server/auth/server-session";
import { RecommendationsPageClient } from "./recommendations-page-client";

export default async function RecommendationsPage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/login");
  }

  const workspaceId = session.user.workspaceId;
  if (!workspaceId) {
    redirect("/login");
  }

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(
    trpc.recommendations.list.queryOptions({ workspaceId })
  );

  return (
    <HydrateClient>
      <RecommendationsPageClient workspaceId={workspaceId} />
    </HydrateClient>
  );
}
