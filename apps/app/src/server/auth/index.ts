import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema";
import { workspaces, workspaceMembers } from "../db/schema";
import { nanoid } from "nanoid";

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is not set in environment variables");
}

if (!process.env.BETTER_AUTH_URL) {
  throw new Error("BETTER_AUTH_URL is not set in environment variables");
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verificationTokens,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production with email service
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (update session if older than 1 day)
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3001",
    process.env.NEXT_PUBLIC_MARKETING_APP_URL || "http://localhost:3000",
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Create a default workspace for the new user and add them as owner
          const workspaceId = `workspace_${nanoid()}`;
          const slug = `workspace-${user.id.slice(-8)}`;
          await db.insert(workspaces).values({
            id: workspaceId,
            name: `${user.name ?? "My"} Store`,
            slug,
          });
          await db.insert(workspaceMembers).values({
            id: `wm_${nanoid()}`,
            workspaceId,
            userId: user.id,
            role: "owner",
          });
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
