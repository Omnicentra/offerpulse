import type { inferRouterOutputs } from "@trpc/server";
import { router } from "../trpc";
import { authRouter } from "./auth";
import { competitorsRouter } from "./competitors";
import { monitorSettingsRouter } from "./monitor-settings";
import { snapshotsRouter } from "./snapshots";
import { changeEventsRouter } from "./change-events";
import { recommendationsRouter } from "./recommendations";
import { alertsRouter } from "./alerts";
import { weeklyPulseRouter } from "./weekly-pulse";
import { usersRouter } from "./users";
import { workspaceSettingsRouter } from "./workspace-settings";

export const appRouter = router({
  auth: authRouter,
  competitors: competitorsRouter,
  monitorSettings: monitorSettingsRouter,
  snapshots: snapshotsRouter,
  changeEvents: changeEventsRouter,
  recommendations: recommendationsRouter,
  alerts: alertsRouter,
  weeklyPulse: weeklyPulseRouter,
  users: usersRouter,
  workspaceSettings: workspaceSettingsRouter,
});

export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
