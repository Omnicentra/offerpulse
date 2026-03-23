import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/src/server/auth";
import { createCaller } from "@/src/lib/trpc/server";
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

  const caller = await createCaller();

  const initialRecommendations = await caller.recommendations.list({ workspaceId });

  return (
    <RecommendationsPageClient
      workspaceId={workspaceId}
      initialRecommendations={initialRecommendations}
    />
  );
}
