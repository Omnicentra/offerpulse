import { initTRPC, TRPCError } from "@trpc/server";
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { db } from "../db";
import { auth } from "../auth";
import { workspaceMembers, workspaces } from "../db/schema";
import { eq, and } from "drizzle-orm";

/** Context options: full opts from fetch handler, or minimal opts for server-side caller (no info) */
export type CreateContextOptions = Omit<FetchCreateContextFnOptions, "info"> & {
  info?: FetchCreateContextFnOptions["info"];
};

/**
 * Create context for tRPC requests
 */
export async function createTRPCContext(opts: CreateContextOptions) {
  // Get session from Better-auth
  const session = await auth.api.getSession({
    headers: opts.req.headers,
  });

  return {
    db,
    session,
    user: session?.user,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * Initialize tRPC
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error ? error.cause.message : null,
      },
    };
  },
});

/**
 * Public procedure - no authentication required
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.user,
    },
  });
});

/**
 * Workspace procedure - requires authentication and workspace membership
 * Adds the current workspace to the context
 */
export const workspaceProcedure = protectedProcedure.use(
  async ({ ctx, next, getRawInput }) => {
    const rawInput = await getRawInput();
    const input = rawInput as { workspaceId?: string };

    if (!input.workspaceId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Workspace ID is required",
      });
    }

    // Check if user is a member of the workspace
    const membership = await ctx.db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, input.workspaceId),
        eq(workspaceMembers.userId, ctx.user.id)
      ),
      with: {
        workspace: true,
      },
    });

    if (!membership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this workspace",
      });
    }

    return next({
      ctx: {
        ...ctx,
        workspace: membership.workspace,
        workspaceMembership: membership,
      },
    });
  }
);

/**
 * Router and procedure exports
 */
export const router = t.router;
export const middleware = t.middleware;
export const mergeRouters = t.mergeRouters;
export const createCallerFactory = t.createCallerFactory;
