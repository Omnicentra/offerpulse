import { initTRPC, TRPCError } from "@trpc/server";
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import * as Sentry from "@sentry/nextjs";
import superjson from "superjson";
import { db } from "../db";
import { auth } from "../auth";
import { subscriptions, workspaceMembers } from "../db/schema";
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
    Sentry.withScope((scope) => {
      scope.setTag("trpc_code", error.code);
      if (shape.data.httpStatus) {
        scope.setTag("http_status", String(shape.data.httpStatus));
      }
      Sentry.captureException(error);
    });

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
 * Subscribed procedure - requires authentication and an active subscription
 */
export const subscribedProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    const subscription = await ctx.db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, ctx.user.id),
    });

    if (
      !subscription ||
      !["active", "trialing"].includes(subscription.status)
    ) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "An active subscription is required to access this feature.",
      });
    }

    if (subscription.currentPeriodEnd < new Date()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Your subscription has expired. Please update your billing.",
      });
    }

    return next({
      ctx: {
        ...ctx,
        subscription,
      },
    });
  }
);

/**
 * Workspace procedure - requires active subscription and workspace membership
 */
export const workspaceProcedure = subscribedProcedure.use(
  async ({ ctx, next, getRawInput }) => {
    const rawInput = await getRawInput();
    const input = rawInput as { workspaceId?: string };

    if (!input.workspaceId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Workspace ID is required",
      });
    }

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
 * Shopify integration procedure - requires Growth or Agency plan
 */
export const shopifyIntegrationProcedure = workspaceProcedure.use(
  async ({ ctx, next }) => {
    const planId = ctx.subscription.planId as string;
    const isAdmin = ctx.user?.role === "admin";

    if (!isAdmin && !["growth", "agency"].includes(planId)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Shopify integration requires Growth or Agency plan",
      });
    }
    return next({ ctx });
  }
);

/**
 * Router and procedure exports
 */
export const router = t.router;
export const middleware = t.middleware;
export const mergeRouters = t.mergeRouters;
export const createCallerFactory = t.createCallerFactory;
