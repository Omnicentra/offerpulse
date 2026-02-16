import { router, workspaceProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { workspaceMembers, users } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export const usersRouter = router({
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
      let user = await ctx.db.query.users.findFirst({
        where: eq(users.email, input.email),
      });

      // If user doesn't exist, create a placeholder
      // In production, you'd send an invitation email instead
      if (!user) {
        [user] = await ctx.db
          .insert(users)
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
          eq(workspaceMembers.userId, user.id)
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
          userId: user.id,
          role: input.role,
        })
        .returning();

      return {
        id: user.id,
        name: user.name,
        email: user.email,
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
});
