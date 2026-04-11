import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/src/server/auth";
import { getQueryClient, HydrateClient, trpc } from "@/src/lib/trpc/server";
import { RecommendationsPageClient } from "./recommendations-page-client";

export default async function RecommendationsPage() {
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
    trpc.recommendations.list.queryOptions({ workspaceId })
  );

  return (
    <HydrateClient>
      <RecommendationsPageClient workspaceId={workspaceId} />
    </HydrateClient>
  );
}
