import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/src/server/auth";
import { createCaller } from "@/src/lib/trpc/server";
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

  const caller = await createCaller();

  const [pulses, competitors] = await Promise.all([
    caller.weeklyPulse.list({ workspaceId }),
    caller.competitors.list({ workspaceId }),
  ]);

  const firstWeekIso =
    pulses.length > 0 ? new Date(pulses[0].weekOf).toISOString() : "";

  const weekFromUrlValid =
    weekParam &&
    pulses.some((p) => new Date(p.weekOf).toISOString() === weekParam);

  const initialWeekIso = weekFromUrlValid ? weekParam! : firstWeekIso;

  const initialCurrentPulse =
    initialWeekIso.length > 0
      ? await caller.weeklyPulse.get({
          workspaceId,
          weekOf: initialWeekIso,
        })
      : null;

  return (
    <WeeklyPulsePageClient
      workspaceId={workspaceId}
      initialPulses={pulses}
      initialCurrentPulse={initialCurrentPulse}
      initialCompetitors={competitors}
      initialWeekIso={initialWeekIso}
    />
  );
}
