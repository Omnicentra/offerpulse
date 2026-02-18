import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { AppRouter } from "@/src/server/trpc/routers/root";

/**
 * tRPC + TanStack React Query integration (v11 recommended pattern)
 *
 * - TRPCProvider: wrap your app to provide tRPC context
 * - useTRPC: access typed query/mutation option factories inside components
 * - useTRPCClient: access the raw tRPC client for imperative calls
 */
export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>();
