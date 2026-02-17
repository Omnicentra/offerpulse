import "server-only";

import { createTRPCContext, createCallerFactory } from "@/src/server/trpc/trpc";
import { appRouter } from "@/src/server/trpc/routers/root";
import { headers } from "next/headers";

/**
 * Create a server-side tRPC caller
 * Use this in server components and server actions
 */
export const createCaller = async () => {
  const headersList = await headers();

  const context = await createTRPCContext({
    req: new Request("https://offerpulse.local", { headers: headersList }),
    resHeaders: new Headers(),
  });

  const caller = createCallerFactory(appRouter)(context);
  return caller;
};
