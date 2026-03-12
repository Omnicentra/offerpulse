import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema";
import { workspaces, workspaceMembers } from "../db/schema";
import { nanoid } from "nanoid";
import { env } from "@/env";
import { sendWelcomeEmail, sendResetPasswordEmail } from "../notifications";
import { customSession } from "better-auth/plugins";
import { logger, TRIAL_PERIOD_DAYS } from "@offerpulse/lib";
import Stripe from "stripe";

export async function getDefaultWorkspaceId(userId: string) {
  const [membership] = await db.select().from(workspaceMembers).where(eq(workspaceMembers.userId, userId)).limit(1);
  if (!membership) {
    throw new Error("User is not a member of any workspace");
  }
  return membership.workspaceId;
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail(user.email, {
        userName: user.name ?? null,
        resetUrl: url,
      }).catch((err) => {
        logger.warn("Reset password email failed:", err);
      });
    },
  },

  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (update session if older than 1 day)
  },
  trustedOrigins: [
    env.BETTER_AUTH_URL,
    env.NEXT_PUBLIC_MARKETING_APP_URL || "http://localhost:3000",
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

          // Create Stripe subscription with trial (fire-and-forget; do not block signup)
          (async () => {
            try {
              const stripe = new Stripe(env.STRIPE_SECRET_KEY);
              logger.debug("Creating Stripe trial subscription for new user", { userId: user.id });

              const prices = await stripe.prices.list({
                lookup_keys: ["starter_monthly"],
                limit: 1,
              });

              const price = prices.data[0];
              if (!price) {
                logger.error("Starter monthly price not found in Stripe", { userId: user.id });
                return;
              }

              const customer = await stripe.customers.create({
                email: user.email,
                name: user.name ?? undefined,
                metadata: { userId: user.id },
              });

              const subscription = await stripe.subscriptions.create({
                customer: customer.id,
                items: [{ price: price.id }],
                trial_period_days: TRIAL_PERIOD_DAYS,
                metadata: { userId: user.id, lookupKey: "starter_monthly" },
              });

              logger.info("Stripe trial subscription created", {
                userId: user.id,
                subscriptionId: subscription.id,
                customerId: customer.id,
              });
            } catch (error) {
              logger.error("Failed to create Stripe trial subscription", error, { userId: user.id });
            }
          })();

          // Send welcome email (fire-and-forget; do not block signup)
          if (user.email) {
            sendWelcomeEmail(user.email, {
              userName: user.name ?? null,
              dashboardUrl: env.NEXT_PUBLIC_DASHBOARD_APP_URL,
            }).catch((err) => {
              logger.warn("Welcome email failed:", err);
            });
          }
        },
      },
    },
  },
  plugins: [
    customSession(async ({user, session}) => {
      const workspaceId = await getDefaultWorkspaceId(user.id);
      return {
        ...session,
        user: {
          ...user,
          workspaceId,
        },
      };
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
