import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema";
import { workspaces, workspaceMembers, user } from "../db/schema";
import { nanoid } from "nanoid";
import { env } from "@/env";
import { sendWelcomeEmail, sendResetPasswordEmail, sendInternalAlertEmail } from "../notifications";
import { customSession, admin as adminPlugin } from "better-auth/plugins";
import { logger, TRIAL_PERIOD_DAYS } from "@offerpulse/lib";
import Stripe from "stripe";
import { cache } from "react";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-02-25.clover",
});

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

  logger.debug("getDefaultWorkspaceId result", membership);
  if (!membership) {
    throw new Error("User is not a member of any workspace");
  }
  return membership;
});

export const getPriceId = cache(async (lookupKey: string) => {
  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
    limit: 1,
  });
  return prices.data[0]?.id;
});

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
          try {
            logger.debug("Creating Stripe trial subscription for new user", { userId: user.id });

            const priceId = await getPriceId("starter_monthly");
            if (!priceId) {
              logger.error("Starter monthly price not found in Stripe", { userId: user.id });

              await sendInternalAlertEmail(
                "OfferPulse alert: starter_monthly Stripe price missing",
                [
                  "<p>Failed to create Stripe trial subscription for a new user because the <code>starter_monthly</code> price could not be found.</p>",
                  `<p><strong>User ID:</strong> ${user.id}</p>`,
                  `<p><strong>User email:</strong> ${user.email ?? "N/A"}</p>`,
                  "<p>Please verify that the Stripe price with lookup key <code>starter_monthly</code> exists and is active.</p>",
                ].join("")
              );

              return;
            }

            const customer = await stripe.customers.create({
              email: user.email,
              name: user.name ?? undefined,
              metadata: { userId: user.id },
            });

            const subscription = await stripe.subscriptions.create({
              customer: customer.id,
              items: [{ price: priceId }],
              trial_period_days: TRIAL_PERIOD_DAYS,
              metadata: { userId: user.id, lookupKey: "growth_monthly" },
              payment_settings: {
                save_default_payment_method: 'on_subscription',
              },
              trial_settings: {
                end_behavior: {
                  missing_payment_method: 'cancel',
                },
              },
            });

            logger.info("Stripe trial subscription created", {
              userId: user.id,
              subscriptionId: subscription.id,
              customerId: customer.id,
              lookupKey: "growth_monthly",
            });
          } catch (error) {
            logger.error("Failed to create Stripe trial subscription", error, { userId: user.id });
          }
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
    adminPlugin(),
    customSession(async ({ user, session }) => {
      const { workspaceId, userRole } = await getDefaultWorkspaceId(user.id);
      return {
        ...session,
        user: {
          ...user,
          workspaceId,
          role: userRole,
        },
      };
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
