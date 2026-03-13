import { inngest } from "../client";
import { db } from "../../db";
import {
  ownStores,
  storeProducts,
  storePromos,
  storeProductHistory,
} from "../../db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { env } from "@/env";
import { decryptToken } from "../../shopify/oauth";
import { fetchAllProductsJson } from "../../shopify/products-json";
import { fetchPriceRules } from "../../shopify/admin-api";
import {
  transformProduct,
  transformPriceRule,
} from "../../shopify/sync-utils";
import { detectProductChanges } from "../../shopify/change-detector";
import { logger } from "@offerpulse/lib";

export const syncShopifyStoreJob = inngest.createFunction(
  {
    id: "sync-shopify-store",
    name: "Sync Shopify Store",
    retries: 3,
  },
  { event: "shopify/store.sync" },
  async ({ event, step }) => {
    const { workspaceId } = event.data;

    const store = await step.run("fetch-store", async () => {
      const [s] = await db
        .select()
        .from(ownStores)
        .where(eq(ownStores.workspaceId, workspaceId));

      if (!s || s.platform !== "shopify" || !s.shopifyAccessToken || !s.shopifyShopDomain) {
        throw new Error("Store not found or not connected to Shopify");
      }

      await db
        .update(ownStores)
        .set({ syncStatus: "syncing", syncError: null })
        .where(eq(ownStores.id, s.id));

      return s;
    });

    if (!store) throw new Error("Store not found");

    let accessToken: string;
    try {
      accessToken = decryptToken(store.shopifyAccessToken!, env.BETTER_AUTH_SECRET);
    } catch (err) {
      logger.error("[sync-shopify-store] Token decryption failed", { workspaceId });
      await db
        .update(ownStores)
        .set({
          syncStatus: "error",
          syncError: "Invalid access token",
        })
        .where(eq(ownStores.id, store.id));
      throw err;
    }

    const products = await step.run("fetch-products", async () => {
      return fetchAllProductsJson(store.shopifyShopDomain!);
    });

    const priceRules = await step.run("fetch-promos", async () => {
      try {
        return await fetchPriceRules(store.shopifyShopDomain!, accessToken);
      } catch (err) {
        logger.warn("[sync-shopify-store] Price rules fetch failed, continuing without", err);
        return [];
      }
    });

    await step.run("update-database", async () => {
      const transformedProducts = products.flatMap(transformProduct);
      const transformedPromos = priceRules.map(transformPriceRule);

      const existingProducts = await db
        .select()
        .from(storeProducts)
        .where(eq(storeProducts.ownStoreId, store.id));

      const existingByExternalId = new Map(existingProducts.map((p) => [p.externalId, p]));
      const incomingExternalIds = new Set(transformedProducts.map((p) => p.externalId));

      for (const p of transformedProducts) {
        const existing = existingByExternalId.get(p.externalId);
        if (existing) {
          const changes = detectProductChanges(
            {
              id: existing.id,
              externalId: existing.externalId,
              price: existing.price,
              compareAtPrice: existing.compareAtPrice,
              available: existing.available,
              variants: (existing.variants as unknown[]) ?? [],
            },
            {
              externalId: p.externalId,
              price: p.price,
              compareAtPrice: p.compareAtPrice,
              available: p.available,
              variants: p.variants,
            }
          );
          if (changes.length > 0) {
            await db.insert(storeProductHistory).values(
              changes.map((c) => ({
                id: `hist_${nanoid()}`,
                storeProductId: existing.id,
                fieldChanged: c.field as "price" | "compareAtPrice" | "available" | "variants",
                oldValue: c.oldValue,
                newValue: c.newValue,
                detectedBy: "sync" as const,
              }))
            );
          }
          await db
            .update(storeProducts)
            .set({
              name: p.name,
              description: p.description,
              price: p.price,
              compareAtPrice: p.compareAtPrice,
              available: p.available,
              variants: p.variants,
              images: p.images,
              tags: p.tags,
              productType: p.productType,
              vendor: p.vendor,
            })
            .where(eq(storeProducts.id, existing.id));
        } else {
          await db.insert(storeProducts).values({
            id: `prod_${nanoid()}`,
            ownStoreId: store.id,
            externalId: p.externalId,
            name: p.name,
            description: p.description,
            price: p.price,
            compareAtPrice: p.compareAtPrice,
            available: p.available,
            variants: p.variants,
            images: p.images,
            tags: p.tags,
            productType: p.productType,
            vendor: p.vendor,
          });
        }
      }

      for (const existing of existingProducts) {
        if (!incomingExternalIds.has(existing.externalId)) {
          await db.delete(storeProducts).where(eq(storeProducts.id, existing.id));
        }
      }

      await db.delete(storePromos).where(eq(storePromos.ownStoreId, store.id));
      if (transformedPromos.length > 0) {
        await db.insert(storePromos).values(
          transformedPromos.map((p) => ({
            id: `promo_${nanoid()}`,
            ownStoreId: store.id,
            name: p.name,
            discountType: p.discountType,
            discountValue: p.discountValue,
            startDate: p.startDate,
            endDate: p.endDate,
            active: p.active,
          }))
        );
      }

      await db
        .update(ownStores)
        .set({
          syncStatus: "idle",
          syncError: null,
          lastSyncedAt: new Date(),
        })
        .where(eq(ownStores.id, store.id));
    });

    logger.info("[sync-shopify-store] Sync completed", {
      workspaceId,
      productCount: products.flatMap(transformProduct).length,
      promoCount: priceRules.length,
    });

    return { success: true };
  }
);
