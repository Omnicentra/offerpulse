import "server-only";

import type { ReactNode } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { cache } from "react";
import { headers } from "next/headers";
import { createTRPCContext } from "@/src/server/trpc/trpc";
import { appRouter } from "@/src/server/trpc/routers/root";
import { makeQueryClient } from "@/src/lib/trpc/query-client";

export const getQueryClient = cache(makeQueryClient);

async function createServerTRPCContext() {
  const headersList = await headers();
  return createTRPCContext({
    req: new Request("https://offerpulse.local", { headers: headersList }),
    resHeaders: new Headers(),
  });
}

export const trpc = createTRPCOptionsProxy({
  ctx: createServerTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});

export function HydrateClient(props: { children: ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}
