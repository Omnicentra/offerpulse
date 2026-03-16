import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { logger } from "@offerpulse/lib";
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

  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const shop = params.get("shop");
  const hmac = params.get("hmac");

  logger.info("[shopify/auth/callback] Received callback", {
    hasCode: Boolean(code),
    hasState: Boolean(state),
    shop,
    hasHmac: Boolean(hmac),
  });

  if (!code || !state || !shop || !hmac) {
    logger.warn("[shopify/auth/callback] Missing required params", {
      hasCode: Boolean(code),
      hasState: Boolean(state),
      shop,
      hasHmac: Boolean(hmac),
    });
    return Response.redirect(
      redirectUrl("/settings/store", { error: "oauth_failed" })
    );
  }

  if (!verifyShopifyHmac(params, apiSecret)) {
    logger.warn("[shopify/auth/callback] HMAC verification failed", { shop });
    return Response.redirect(
      redirectUrl("/settings/store", { error: "invalid_hmac" })
    );
  }

  const [oauthState] = await db
    .select()
    .from(shopifyOauthStates)
    .where(eq(shopifyOauthStates.state, state));

  if (!oauthState) {
    logger.warn("[shopify/auth/callback] State not found in DB", {
      statePrefix: state.slice(0, 8),
      shop,
    });
    return Response.redirect(
      redirectUrl("/settings/store", { error: "invalid_state" })
    );
  }

  logger.debug("[shopify/auth/callback] State validated", {
    workspaceId: oauthState.workspaceId,
    expiresAt: oauthState.expiresAt.toISOString(),
  });

  if (oauthState.expiresAt < new Date()) {
    logger.warn("[shopify/auth/callback] State expired", {
      workspaceId: oauthState.workspaceId,
      expiresAt: oauthState.expiresAt.toISOString(),
    });
    await db.delete(shopifyOauthStates).where(eq(shopifyOauthStates.state, state));
    return Response.redirect(
      redirectUrl("/settings/store", { error: "state_expired" })
    );
  }

  const redirectUri = `${env.NEXT_PUBLIC_DASHBOARD_APP_URL}/api/shopify/auth/callback`;

  let accessToken: string;
  try {
    logger.debug("[shopify/auth/callback] Exchanging code for token", {
      shop,
      redirectUri,
    });
    const tokenResponse = await exchangeCodeForToken(
      shop,
      code,
      apiKey,
      apiSecret,
      redirectUri
    );
    accessToken = tokenResponse.access_token;
    logger.info("[shopify/auth/callback] Token exchange successful", {
      shop,
      workspaceId: oauthState.workspaceId,
    });
  } catch (err) {
    logger.error("[shopify/auth/callback] Token exchange failed", {
      shop,
      workspaceId: oauthState.workspaceId,
      error: err instanceof Error ? err.message : String(err),
    });
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
    logger.debug("[shopify/auth/callback] Updating existing store", {
      storeId: existingStore.id,
      workspaceId: oauthState.workspaceId,
      shop,
    });
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
    logger.debug("[shopify/auth/callback] Creating new store", {
      workspaceId: oauthState.workspaceId,
      shop,
    });
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

  if (env.NODE_ENV === "production") {
    logger.info("[shopify/auth/callback] Triggering initial sync", {
      workspaceId: oauthState.workspaceId,
      shop,
    });
    await inngest.send({
      name: "shopify/store.sync",
      data: {
        workspaceId: oauthState.workspaceId,
      },
    });
  } else {
    logger.debug("[shopify/auth/callback] Skipping sync (non-production)", {
      NODE_ENV: env.NODE_ENV,
    });
  }

  const destination = redirectUrl("/onboarding/shopify", {
    shopify_connected: "true",
  });
  logger.info("[shopify/auth/callback] OAuth complete, redirecting", {
    workspaceId: oauthState.workspaceId,
    shop,
    destination,
  });

  return Response.redirect(destination);
}
