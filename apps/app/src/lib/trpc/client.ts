import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/src/server/trpc/routers/root";

/**
 * Create a client-side tRPC instance
 * Use this in client components via hooks
 */
export const trpc = createTRPCReact<AppRouter>();
