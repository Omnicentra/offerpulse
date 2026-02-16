import "server-only";

import { createTRPCContext } from "@/src/server/trpc/trpc";
import { appRouter, type AppRouter } from "@/src/server/trpc/routers/_app";
import { createCallerFactory } from "@trpc/server";
import { headers } from "next/headers";

/**
 * Create a server-side tRPC caller
 * Use this in server components and server actions
 */
export const createCaller = async () => {
  const headersList = await headers();

  const context = await createTRPCContext({
    req: {
      headers: headersList,
    } as Request,
    resHeaders: new Headers(),
  });

  const callerFactory = createCallerFactory<AppRouter>();
  return callerFactory(appRouter)(context);
};
