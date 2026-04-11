import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/src/server/auth";
import { getQueryClient, HydrateClient, trpc } from "@/src/lib/trpc/server";
import { WeeklyPulsePageClient } from "./weekly-pulse-page-client";

interface WeeklyPulsePageProps {
  searchParams: Promise<{ week?: string }>;
}

export default async function WeeklyPulsePage({ searchParams }: WeeklyPulsePageProps) {
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

  const params = await searchParams;
  const weekParam = params.week;

  const queryClient = getQueryClient();

  const [pulses] = await Promise.all([
    queryClient.fetchQuery(
      trpc.weeklyPulse.list.queryOptions({ workspaceId })
    ),
    queryClient.fetchQuery(
      trpc.competitors.list.queryOptions({ workspaceId })
    ),
  ]);

  const firstWeekIso =
    pulses.length > 0 ? new Date(pulses[0].weekOf).toISOString() : "";

  const weekFromUrlValid =
    weekParam &&
    pulses.some((p) => new Date(p.weekOf).toISOString() === weekParam);

  const initialWeekIso = weekFromUrlValid ? weekParam! : firstWeekIso;

  if (initialWeekIso.length > 0) {
    await queryClient.prefetchQuery(
      trpc.weeklyPulse.get.queryOptions({
        workspaceId,
        weekOf: initialWeekIso,
      })
    );
  }

  return (
    <HydrateClient>
      <WeeklyPulsePageClient
        workspaceId={workspaceId}
        initialWeekIso={initialWeekIso}
      />
    </HydrateClient>
  );
}
