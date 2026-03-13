import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { env } from "@/env";
import { db } from "@/src/server/db";
import {
  shopifyOauthStates,
  ownStores,
} from "@/src/server/db/schema";
import { eq } from "drizzle-orm";
import {
  verifyShopifyHmac,
  exchangeCodeForToken,
  encryptToken,
} from "@/src/server/shopify/oauth";
import { inngest } from "@/src/server/jobs/client";

const redirectUrl = (path: string, params?: Record<string, string>) => {
  const base = `${env.NEXT_PUBLIC_DASHBOARD_APP_URL}${path}`;
  if (params) {
    const search = new URLSearchParams(params).toString();
    return `${base}?${search}`;
  }
  return base;
};

export async function GET(request: NextRequest) {
  const apiKey = env.SHOPIFY_API_KEY;
  const apiSecret = env.SHOPIFY_API_SECRET;

  if (!apiKey || !apiSecret) {
    return Response.redirect(
      redirectUrl("/settings/store", { error: "shopify_not_configured" })
    );
  }

  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const shop = params.get("shop");
  const hmac = params.get("hmac");

  if (!code || !state || !shop || !hmac) {
    return Response.redirect(
      redirectUrl("/settings/store", { error: "oauth_failed" })
    );
  }

  if (!verifyShopifyHmac(params, apiSecret)) {
    return Response.redirect(
      redirectUrl("/settings/store", { error: "invalid_hmac" })
    );
  }

  const [oauthState] = await db
    .select()
    .from(shopifyOauthStates)
    .where(eq(shopifyOauthStates.state, state));

  if (!oauthState) {
    return Response.redirect(
      redirectUrl("/settings/store", { error: "invalid_state" })
    );
  }

  if (oauthState.expiresAt < new Date()) {
    await db.delete(shopifyOauthStates).where(eq(shopifyOauthStates.state, state));
    return Response.redirect(
      redirectUrl("/settings/store", { error: "state_expired" })
    );
  }

  const redirectUri = `${env.NEXT_PUBLIC_DASHBOARD_APP_URL}/api/shopify/auth/callback`;

  let accessToken: string;
  try {
    const tokenResponse = await exchangeCodeForToken(
      shop,
      code,
      apiKey,
      apiSecret,
      redirectUri
    );
    accessToken = tokenResponse.access_token;
  } catch (err) {
    console.error("Shopify token exchange failed", err);
    return Response.redirect(
      redirectUrl("/settings/store", { error: "token_exchange_failed" })
    );
  }

  const encryptedToken = encryptToken(accessToken, env.BETTER_AUTH_SECRET);

  const [existingStore] = await db
    .select()
    .from(ownStores)
    .where(eq(ownStores.workspaceId, oauthState.workspaceId));

  if (existingStore) {
    await db
      .update(ownStores)
      .set({
        platform: "shopify",
        storeUrl: `https://${shop}`,
        shopifyAccessToken: encryptedToken,
        shopifyShopDomain: shop,
        syncStatus: "idle",
        syncError: null,
      })
      .where(eq(ownStores.id, existingStore.id));
  } else {
    await db.insert(ownStores).values({
      id: `store_${nanoid()}`,
      workspaceId: oauthState.workspaceId,
      platform: "shopify",
      storeUrl: `https://${shop}`,
      storeName: shop.replace(".myshopify.com", ""),
      currency: "GBP",
      shopifyAccessToken: encryptedToken,
      shopifyShopDomain: shop,
      syncStatus: "idle",
    });
  }

  await db.delete(shopifyOauthStates).where(eq(shopifyOauthStates.state, state));

  await inngest.send({
    name: "shopify/store.sync",
    data: {
      workspaceId: oauthState.workspaceId,
    },
  });

  return Response.redirect(
    redirectUrl("/settings/store", { shopify_connected: "true" })
  );
}
