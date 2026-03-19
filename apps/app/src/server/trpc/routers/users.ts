import { router, protectedProcedure, subscribedProcedure, workspaceProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { workspaceMembers, workspaces, user, account } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getPlanById, type PlanId } from "@offerpulse/lib/pricing";

export const usersRouter = router({
  getMyWorkspaces: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.query.workspaceMembers.findMany({
      where: eq(workspaceMembers.userId, ctx.user.id),
      with: { workspace: true },
    });
    return memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      role: m.role,
    }));
  }),

  createWorkspace: subscribedProcedure
    .input(z.object({ name: z.string().min(1).max(100), slug: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const memberships = await ctx.db.query.workspaceMembers.findMany({
        where: eq(workspaceMembers.userId, ctx.user.id),
      });

      const plan = getPlanById(ctx.subscription.planId as PlanId);
      const maxWorkspaces = plan?.maxWorkspaces ?? 1;

      if (memberships.length >= maxWorkspaces) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Your ${plan?.name ?? "current"} plan allows ${maxWorkspaces} workspace${maxWorkspaces > 1 ? "s" : ""}. Upgrade to create more.`,
        });
      }

      const existingSlug = await ctx.db.query.workspaces.findFirst({
        where: eq(workspaces.slug, input.slug),
      });
      if (existingSlug) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A workspace with that slug already exists.",
        });
      }

      const workspaceId = `workspace_${nanoid()}`;
      await ctx.db.insert(workspaces).values({
        id: workspaceId,
        name: input.name,
        slug: input.slug,
      });
      await ctx.db.insert(workspaceMembers).values({
        id: `wm_${nanoid()}`,
        workspaceId,
        userId: ctx.user.id,
        role: "owner",
      });

      return { id: workspaceId, name: input.name, slug: input.slug };
    }),

  list: workspaceProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const members = await ctx.db.query.workspaceMembers.findMany({
        where: eq(workspaceMembers.workspaceId, input.workspaceId),
        with: {
          user: true,
        },
      });

      return members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        membershipId: m.id,
        createdAt: m.createdAt,
      }));
    }),

  invite: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        email: z.string().email(),
        role: z.enum(["owner", "admin", "member"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already exists
      let invitedUser = await ctx.db.query.user.findFirst({
        where: eq(user.email, input.email),
      });

      // If user doesn't exist, create a placeholder
      // In production, you'd send an invitation email instead
      if (!invitedUser) {
        [invitedUser] = await ctx.db
          .insert(user)
          .values({
            id: `user_${nanoid()}`,
            email: input.email,
            name: input.email.split("@")[0],
          })
          .returning();
      }

      // Check if already a member
      const existing = await ctx.db.query.workspaceMembers.findFirst({
        where: and(
          eq(workspaceMembers.workspaceId, input.workspaceId),
          eq(workspaceMembers.userId, invitedUser.id)
        ),
      });

      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is already a member of this workspace",
        });
      }

      // Add to workspace
      const [membership] = await ctx.db
        .insert(workspaceMembers)
        .values({
          id: `wm_${nanoid()}`,
          workspaceId: input.workspaceId,
          userId: invitedUser.id,
          role: input.role,
        })
        .returning();

      return {
        id: invitedUser.id,
        name: invitedUser.name,
        email: invitedUser.email,
        role: membership.role,
        membershipId: membership.id,
        createdAt: membership.createdAt,
      };
    }),

  remove: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), membershipId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify membership belongs to workspace
      const membership = await ctx.db.query.workspaceMembers.findFirst({
        where: and(
          eq(workspaceMembers.id, input.membershipId),
          eq(workspaceMembers.workspaceId, input.workspaceId)
        ),
      });

      if (!membership) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      // Don't allow removing yourself if you're the only owner
      const owners = await ctx.db.query.workspaceMembers.findMany({
        where: and(
          eq(workspaceMembers.workspaceId, input.workspaceId),
          eq(workspaceMembers.role, "owner")
        ),
      });

      if (
        membership.userId === ctx.user.id &&
        membership.role === "owner" &&
        owners.length === 1
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot remove the last owner from the workspace",
        });
      }

      await ctx.db
        .delete(workspaceMembers)
        .where(eq(workspaceMembers.id, input.membershipId));

      return { success: true };
    }),

  updateRole: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        membershipId: z.string(),
        role: z.enum(["owner", "admin", "member"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify membership belongs to workspace
      const membership = await ctx.db.query.workspaceMembers.findFirst({
        where: and(
          eq(workspaceMembers.id, input.membershipId),
          eq(workspaceMembers.workspaceId, input.workspaceId)
        ),
        with: {
          user: true,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      const [updated] = await ctx.db
        .update(workspaceMembers)
        .set({ role: input.role })
        .where(eq(workspaceMembers.id, input.membershipId))
        .returning();

      return {
        id: membership.user.id,
        name: membership.user.name,
        email: membership.user.email,
        role: updated.role,
        membershipId: updated.id,
        createdAt: updated.createdAt,
      };
    }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const userRecord = await ctx.db.query.user.findFirst({
      where: eq(user.id, ctx.user.id),
    });

    if (!userRecord) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const credentialAccount = await ctx.db.query.account.findFirst({
      where: and(
        eq(account.userId, ctx.user.id),
        eq(account.providerId, "credential")
      ),
    });

    return {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      image: userRecord.image,
      createdAt: userRecord.createdAt,
      hasPassword: !!credentialAccount,
    };
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        image: z.string().url().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updates: { name?: string; image?: string | null } = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.image !== undefined) updates.image = input.image;

      const [updated] = await ctx.db
        .update(user)
        .set(updates)
        .where(eq(user.id, ctx.user.id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        image: updated.image,
      };
    }),
});
