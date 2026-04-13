import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "./index";

export async function getSessionFromHeaders(headersList: Headers) {
  return auth.api.getSession({ headers: headersList });
}

/**
 * Request-scoped session via React.cache. Multiple callers in the same request
 * (RSC page, tRPC prefetch, createTRPCContext) share one Better Auth / DB read.
 */
export const getServerSession = cache(async () => {
  const headersList = await headers();
  return getSessionFromHeaders(headersList);
});
