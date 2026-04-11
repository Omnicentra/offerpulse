import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { user, workspaceMembers } from "../db/schema";

export const getDefaultWorkspaceId = cache(async (userId: string) => {
  const [membership] = await db
    .select({
      workspaceId: workspaceMembers.workspaceId,
      userRole: user.role,
    })
    .from(workspaceMembers)
    .leftJoin(user, eq(workspaceMembers.userId, user.id))
    .where(eq(workspaceMembers.userId, userId))
    .limit(1);

  if (!membership) {
    throw new Error("User is not a member of any workspace");
  }
  return membership;
});
