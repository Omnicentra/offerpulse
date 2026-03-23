import type { inferRouterOutputs } from "@trpc/server";
import { router } from "../trpc";
import { authRouter } from "./auth";
import { billingRouter } from "./billing";
import { competitorsRouter } from "./competitors";
import { monitorSettingsRouter } from "./monitor-settings";
import { snapshotsRouter } from "./snapshots";
import { changeEventsRouter } from "./change-events";
import { recommendationsRouter } from "./recommendations";
import { alertsRouter } from "./alerts";
import { weeklyPulseRouter } from "./weekly-pulse";
import { usersRouter } from "./users";
import { workspaceSettingsRouter } from "./workspace-settings";
import { ownStoreRouter } from "./own-store";
import { shopifyRouter } from "./shopify";
import { searchRouter } from "./search";

export const appRouter = router({
  auth: authRouter,
  billing: billingRouter,
  competitors: competitorsRouter,
  monitorSettings: monitorSettingsRouter,
  snapshots: snapshotsRouter,
  changeEvents: changeEventsRouter,
  recommendations: recommendationsRouter,
  alerts: alertsRouter,
  weeklyPulse: weeklyPulseRouter,
  users: usersRouter,
  workspaceSettings: workspaceSettingsRouter,
  ownStore: ownStoreRouter,
  shopify: shopifyRouter,
  search: searchRouter,
});

export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
