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

const TEN_MINUTES_MS = 10 * 60 * 1000;

export async function GET(request: NextRequest) {
  const apiKey = env.SHOPIFY_API_KEY;
  const apiSecret = env.SHOPIFY_API_SECRET;

  if (!apiKey || !apiSecret) {
    return Response.redirect(
      `${env.NEXT_PUBLIC_DASHBOARD_APP_URL}/settings/store?error=shopify_not_configured`
    );
  }

  const shop = request.nextUrl.searchParams.get("shop");
  const workspaceId = request.nextUrl.searchParams.get("workspaceId");

  if (!shop || !workspaceId) {
    return Response.redirect(
      `${env.NEXT_PUBLIC_DASHBOARD_APP_URL}/settings/store?error=missing_params`
    );
  }

  const normalizedShop = shop.includes(".myshopify.com")
    ? shop
    : `${shop}.myshopify.com`;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return Response.redirect(
      `${env.NEXT_PUBLIC_DASHBOARD_APP_URL}/login?redirect=/settings/store`
    );
  }

  const membership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.userId, session.user.id)
    ),
  });

  if (!membership) {
    return Response.redirect(
      `${env.NEXT_PUBLIC_DASHBOARD_APP_URL}/settings/store?error=forbidden`
    );
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, session.user.id),
  });

  const planId = subscription?.planId as string | undefined;
  const plan = planId ? getPlanById(planId as "starter" | "growth" | "agency") : undefined;
  if (!plan?.limits.shopifyIntegration) {
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

  const redirectUri = `${env.NEXT_PUBLIC_DASHBOARD_APP_URL}/api/shopify/auth/callback`;
  const scopes = env.SHOPIFY_SCOPES;

  const authUrl = new URL(`https://${normalizedShop}/admin/oauth/authorize`);
  authUrl.searchParams.set("client_id", apiKey);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);

  return Response.redirect(authUrl.toString());
}
