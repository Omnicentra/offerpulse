import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { env } from "@/env";
import { db } from "@/src/server/db";
import {
  shopifyOauthStates,
  workspaceMembers,
  subscriptions,
} from "@/src/server/db/schema";
import { auth } from "@/src/server/auth";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { getPlanById } from "@offerpulse/lib/pricing";
import { logger } from "@offerpulse/lib";

const TEN_MINUTES_MS = 10 * 60 * 1000;

export async function GET(request: NextRequest) {
  const apiKey = env.SHOPIFY_API_KEY;

  const shop = request.nextUrl.searchParams.get("shop");
  const workspaceId = request.nextUrl.searchParams.get("workspaceId");

  logger.info("[shopify/auth/start] Received request", {
    shop,
    workspaceId,
    hasApiKey: Boolean(apiKey),
  });

  if (!shop || !workspaceId) {
    logger.warn("[shopify/auth/start] Missing required params", {
      shop,
      workspaceId,
    });
    return Response.redirect(
      `${env.NEXT_PUBLIC_DASHBOARD_APP_URL}/settings/store?error=missing_params`
    );
  }

  const normalizedShop = shop.includes(".myshopify.com")
    ? shop
    : `${shop}.myshopify.com`;

  logger.debug("[shopify/auth/start] Normalized shop domain", {
    originalShop: shop,
    normalizedShop,
  });

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    logger.warn("[shopify/auth/start] No active session, redirecting to login", {
      normalizedShop,
      workspaceId,
    });
    return Response.redirect(
      `${env.NEXT_PUBLIC_DASHBOARD_APP_URL}/login?redirect=/settings/store`
    );
  }

  logger.debug("[shopify/auth/start] Session loaded", {
    userId: session.user.id,
    userRole: session.user.role,
  });

  const membership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.userId, session.user.id)
    ),
  });

  if (!membership) {
    logger.warn("[shopify/auth/start] User is not a member of workspace", {
      userId: session.user.id,
      workspaceId,
    });
    return Response.redirect(
      `${env.NEXT_PUBLIC_DASHBOARD_APP_URL}/settings/store?error=forbidden`
    );
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, session.user.id),
  });

  const planId = subscription?.planId as string | undefined;
  const plan = planId ? getPlanById(planId as "starter" | "growth" | "agency") : undefined;

  logger.debug("[shopify/auth/start] Subscription resolved", {
    userId: session.user.id,
    planId,
    isAdmin: session.user.role === "admin",
    shopifyIntegrationAllowed: plan?.limits.shopifyIntegration ?? false,
  });

  if (session.user.role !== "admin" && !plan?.limits.shopifyIntegration) {
    logger.info("[shopify/auth/start] Shopify integration not allowed for plan", {
      userId: session.user.id,
      planId,
      workspaceId,
    });
    return Response.redirect(
      `${env.NEXT_PUBLIC_DASHBOARD_APP_URL}/settings/store?error=upgrade_required`
    );
  }

  const state = nanoid(32);
  const expiresAt = new Date(Date.now() + TEN_MINUTES_MS);

  await db.insert(shopifyOauthStates).values({
    state,
    workspaceId,
    shop: normalizedShop,
    expiresAt,
  });

  logger.info("[shopify/auth/start] OAuth state created", {
    state,
    workspaceId,
    normalizedShop,
    expiresAt: expiresAt.toISOString(),
  });

  const redirectUri = `${env.NEXT_PUBLIC_DASHBOARD_APP_URL}/api/shopify/auth/callback`;
  const scopes = env.SHOPIFY_SCOPES;

  const authUrl = new URL(`https://${normalizedShop}/admin/oauth/authorize`);
  authUrl.searchParams.set("client_id", apiKey);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);

  logger.info("[shopify/auth/start] Redirecting to Shopify OAuth", {
    normalizedShop,
    redirectUri,
    scopes,
  });

  return Response.redirect(authUrl.toString());
}
