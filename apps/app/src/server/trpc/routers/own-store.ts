import { router, workspaceProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  ownStores,
  storeProducts,
  storePromos,
  storeProductHistory,
} from "../../db/schema";
import { eq, and, desc, gt } from "drizzle-orm";
import { nanoid } from "nanoid";

const productSchema = z.object({
  externalId: z.string().min(1).optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  compareAtPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  available: z.boolean().default(true),
  variants: z.array(z.record(z.string(), z.unknown())).default([]),
  images: z
    .array(z.object({ src: z.string(), alt: z.string().optional() }))
    .default([]),
  tags: z.array(z.string()).default([]),
  productType: z.string().optional().nullable(),
  vendor: z.string().optional().nullable(),
});

const promoSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  discountType: z.enum(["percentage", "fixed", "bogo", "bundle"]),
  discountValue: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  conditions: z.record(z.string(), z.unknown()).optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  active: z.boolean().default(true),
});

export const ownStoreRouter = router({
  get: workspaceProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      let [store] = await ctx.db
        .select()
        .from(ownStores)
        .where(eq(ownStores.workspaceId, input.workspaceId));

      if (!store) {
        [store] = await ctx.db
          .insert(ownStores)
          .values({
            id: `store_${nanoid()}`,
            workspaceId: input.workspaceId,
            platform: "manual",
            storeName: "My Store",
            currency: "GBP",
          })
          .returning();
      }

      return store;
    }),

  update: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        storeName: z.string().min(1).optional(),
        storeUrl: z.string().url().optional().nullable(),
        currency: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { workspaceId, ...data } = input;

      let [store] = await ctx.db
        .select()
        .from(ownStores)
        .where(eq(ownStores.workspaceId, workspaceId));

      if (!store) {
        [store] = await ctx.db
          .insert(ownStores)
          .values({
            id: `store_${nanoid()}`,
            workspaceId,
            platform: "manual",
            storeName: data.storeName ?? "My Store",
            storeUrl: data.storeUrl ?? null,
            currency: data.currency ?? "GBP",
          })
          .returning();
      } else {
        const updatePayload: Record<string, unknown> = {};
        if (data.storeName !== undefined) updatePayload.storeName = data.storeName;
        if (data.storeUrl !== undefined) updatePayload.storeUrl = data.storeUrl;
        if (data.currency !== undefined) updatePayload.currency = data.currency;

        if (Object.keys(updatePayload).length > 0) {
          [store] = await ctx.db
            .update(ownStores)
            .set(updatePayload)
            .where(eq(ownStores.id, store.id))
            .returning();
        }
      }

      return store!;
    }),

  products: router({
    list: workspaceProcedure
      .input(z.object({ workspaceId: z.string() }))
      .query(async ({ ctx, input }) => {
        const [store] = await ctx.db
          .select()
          .from(ownStores)
          .where(eq(ownStores.workspaceId, input.workspaceId));

        if (!store) return [];

        return ctx.db.query.storeProducts.findMany({
          where: eq(storeProducts.ownStoreId, store.id),
          orderBy: [desc(storeProducts.createdAt)],
        });
      }),

    create: workspaceProcedure
      .input(z.object({ workspaceId: z.string() }).merge(productSchema))
      .mutation(async ({ ctx, input }) => {
        const { workspaceId, ...productData } = input;

        let [store] = await ctx.db
          .select()
          .from(ownStores)
          .where(eq(ownStores.workspaceId, workspaceId));

        if (!store) {
          [store] = await ctx.db
            .insert(ownStores)
            .values({
              id: `store_${nanoid()}`,
              workspaceId,
              platform: "manual",
              storeName: "My Store",
              currency: "GBP",
            })
            .returning();
        }

        const externalId =
          productData.externalId ?? `manual_${nanoid()}`;

        const [product] = await ctx.db
          .insert(storeProducts)
          .values({
            id: `prod_${nanoid()}`,
            ownStoreId: store!.id,
            externalId,
            name: productData.name,
            description: productData.description ?? null,
            price: productData.price,
            compareAtPrice: productData.compareAtPrice ?? null,
            available: productData.available,
            variants: productData.variants,
            images: productData.images,
            tags: productData.tags,
            productType: productData.productType ?? null,
            vendor: productData.vendor ?? null,
          })
          .returning();

        return product!;
      }),

    update: workspaceProcedure
      .input(
        z.object({
          workspaceId: z.string(),
          id: z.string(),
        }).merge(productSchema.partial())
      )
      .mutation(async ({ ctx, input }) => {
        const { workspaceId, id, ...productData } = input;

        const [store] = await ctx.db
          .select()
          .from(ownStores)
          .where(eq(ownStores.workspaceId, workspaceId));

        if (!store) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Store not found",
          });
        }

        const [existing] = await ctx.db
          .select()
          .from(storeProducts)
          .where(
            and(
              eq(storeProducts.id, id),
              eq(storeProducts.ownStoreId, store.id)
            )
          );

        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
        }

        const [updated] = await ctx.db
          .update(storeProducts)
          .set({
            ...productData,
            externalId: productData.externalId ?? existing.externalId,
            name: productData.name ?? existing.name,
            description: productData.description ?? existing.description,
            price: productData.price ?? existing.price,
            compareAtPrice:
              productData.compareAtPrice !== undefined
                ? productData.compareAtPrice
                : existing.compareAtPrice,
            available:
              productData.available !== undefined
                ? productData.available
                : existing.available,
            variants: productData.variants ?? existing.variants,
            images: productData.images ?? existing.images,
            tags: productData.tags ?? existing.tags,
            productType:
              productData.productType !== undefined
                ? productData.productType
                : existing.productType,
            vendor:
              productData.vendor !== undefined
                ? productData.vendor
                : existing.vendor,
          })
          .where(eq(storeProducts.id, id))
          .returning();

        return updated!;
      }),

    delete: workspaceProcedure
      .input(z.object({ workspaceId: z.string(), id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const [store] = await ctx.db
          .select()
          .from(ownStores)
          .where(eq(ownStores.workspaceId, input.workspaceId));

        if (!store) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Store not found",
          });
        }

        const [existing] = await ctx.db
          .select()
          .from(storeProducts)
          .where(
            and(
              eq(storeProducts.id, input.id),
              eq(storeProducts.ownStoreId, store.id)
            )
          );

        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
        }

        await ctx.db.delete(storeProducts).where(eq(storeProducts.id, input.id));
        return { success: true };
      }),

    getHistory: workspaceProcedure
      .input(z.object({ workspaceId: z.string(), productId: z.string() }))
      .query(async ({ ctx, input }) => {
        const [store] = await ctx.db
          .select()
          .from(ownStores)
          .where(eq(ownStores.workspaceId, input.workspaceId));

        if (!store) return [];

        const [product] = await ctx.db
          .select()
          .from(storeProducts)
          .where(
            and(
              eq(storeProducts.id, input.productId),
              eq(storeProducts.ownStoreId, store.id)
            )
          );

        if (!product) return [];

        return ctx.db.query.storeProductHistory.findMany({
          where: eq(storeProductHistory.storeProductId, input.productId),
          orderBy: [desc(storeProductHistory.changedAt)],
          limit: 100,
        });
      }),

    getPriceHistory: workspaceProcedure
      .input(z.object({ workspaceId: z.string(), productId: z.string(), days: z.number().default(30) }))
      .query(async ({ ctx, input }) => {
        const [store] = await ctx.db
          .select()
          .from(ownStores)
          .where(eq(ownStores.workspaceId, input.workspaceId));

        if (!store) return [];

        const [product] = await ctx.db
          .select()
          .from(storeProducts)
          .where(
            and(
              eq(storeProducts.id, input.productId),
              eq(storeProducts.ownStoreId, store.id)
            )
          );

        if (!product) return [];

        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - input.days);

        return ctx.db.query.storeProductHistory.findMany({
          where: and(
            eq(storeProductHistory.storeProductId, input.productId),
            eq(storeProductHistory.fieldChanged, "price"),
            gt(storeProductHistory.changedAt, cutoff)
          ),
          orderBy: [desc(storeProductHistory.changedAt)],
          limit: 200,
        });
      }),
  }),

  promos: router({
    list: workspaceProcedure
      .input(z.object({ workspaceId: z.string() }))
      .query(async ({ ctx, input }) => {
        const [store] = await ctx.db
          .select()
          .from(ownStores)
          .where(eq(ownStores.workspaceId, input.workspaceId));

        if (!store) return [];

        return ctx.db.query.storePromos.findMany({
          where: eq(storePromos.ownStoreId, store.id),
          orderBy: [desc(storePromos.createdAt)],
        });
      }),

    create: workspaceProcedure
      .input(z.object({ workspaceId: z.string() }).merge(promoSchema))
      .mutation(async ({ ctx, input }) => {
        const { workspaceId, ...promoData } = input;

        let [store] = await ctx.db
          .select()
          .from(ownStores)
          .where(eq(ownStores.workspaceId, workspaceId));

        if (!store) {
          [store] = await ctx.db
            .insert(ownStores)
            .values({
              id: `store_${nanoid()}`,
              workspaceId,
              platform: "manual",
              storeName: "My Store",
              currency: "GBP",
            })
            .returning();
        }

        const [promo] = await ctx.db
          .insert(storePromos)
          .values({
            id: `promo_${nanoid()}`,
            ownStoreId: store!.id,
            name: promoData.name,
            description: promoData.description ?? null,
            discountType: promoData.discountType,
            discountValue: promoData.discountValue ?? null,
            conditions: promoData.conditions ?? null,
            startDate: promoData.startDate ? new Date(promoData.startDate) : null,
            endDate: promoData.endDate ? new Date(promoData.endDate) : null,
            active: promoData.active,
          })
          .returning();

        return promo!;
      }),

    update: workspaceProcedure
      .input(
        z.object({
          workspaceId: z.string(),
          id: z.string(),
        }).merge(promoSchema.partial())
      )
      .mutation(async ({ ctx, input }) => {
        const { workspaceId, id, ...promoData } = input;

        const [store] = await ctx.db
          .select()
          .from(ownStores)
          .where(eq(ownStores.workspaceId, workspaceId));

        if (!store) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Store not found",
          });
        }

        const [existing] = await ctx.db
          .select()
          .from(storePromos)
          .where(
            and(
              eq(storePromos.id, id),
              eq(storePromos.ownStoreId, store.id)
            )
          );

        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Promo not found",
          });
        }

        const updatePayload: Record<string, unknown> = {};
        if (promoData.name !== undefined) updatePayload.name = promoData.name;
        if (promoData.description !== undefined)
          updatePayload.description = promoData.description;
        if (promoData.discountType !== undefined)
          updatePayload.discountType = promoData.discountType;
        if (promoData.discountValue !== undefined)
          updatePayload.discountValue = promoData.discountValue;
        if (promoData.conditions !== undefined)
          updatePayload.conditions = promoData.conditions;
        if (promoData.startDate !== undefined)
          updatePayload.startDate = promoData.startDate
            ? new Date(promoData.startDate)
            : null;
        if (promoData.endDate !== undefined)
          updatePayload.endDate = promoData.endDate
            ? new Date(promoData.endDate)
            : null;
        if (promoData.active !== undefined) updatePayload.active = promoData.active;

        const [updated] = await ctx.db
          .update(storePromos)
          .set(updatePayload)
          .where(eq(storePromos.id, id))
          .returning();

        return updated!;
      }),

    delete: workspaceProcedure
      .input(z.object({ workspaceId: z.string(), id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const [store] = await ctx.db
          .select()
          .from(ownStores)
          .where(eq(ownStores.workspaceId, input.workspaceId));

        if (!store) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Store not found",
          });
        }

        const [existing] = await ctx.db
          .select()
          .from(storePromos)
          .where(
            and(
              eq(storePromos.id, input.id),
              eq(storePromos.ownStoreId, store.id)
            )
          );

        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Promo not found",
          });
        }

        await ctx.db.delete(storePromos).where(eq(storePromos.id, input.id));
        return { success: true };
      }),
  }),
});
