import type { ProductsJsonProduct, ProductsJsonVariant } from "./products-json";
import type { PriceRule } from "./admin-api";

export interface TransformedProduct {
  externalId: string;
  name: string;
  description: string | null;
  price: string;
  compareAtPrice: string | null;
  available: boolean;
  variants: Record<string, unknown>[];
  images: Array<{ src: string; alt?: string }>;
  tags: string[];
  productType: string | null;
  vendor: string | null;
}

export interface TransformedPromo {
  name: string;
  discountType: "percentage" | "fixed" | "bogo" | "bundle";
  discountValue: string | null;
  startDate: Date | null;
  endDate: Date | null;
  active: boolean;
}

export function transformProduct(p: ProductsJsonProduct): TransformedProduct[] {
  const results: TransformedProduct[] = [];

  for (const variant of p.variants) {
    const price = variant.price;
    const compareAtPrice = variant.compare_at_price || null;

    results.push({
      externalId: `shopify_${p.id}_${variant.id}`,
      name: variant.title !== "Default Title" ? `${p.title} - ${variant.title}` : p.title,
      description: p.body_html || null,
      price,
      compareAtPrice,
      available: variant.available,
      variants: [
        {
          id: variant.id,
          title: variant.title,
          price: variant.price,
          compare_at_price: variant.compare_at_price,
          available: variant.available,
          sku: variant.sku,
        },
      ],
      images: p.images.map((img) => ({
        src: img.src,
        alt: img.alt ?? undefined,
      })),
      tags: p.tags,
      productType: p.product_type,
      vendor: p.vendor,
    });
  }

  if (results.length === 0) {
    results.push({
      externalId: `shopify_${p.id}`,
      name: p.title,
      description: p.body_html || null,
      price: "0",
      compareAtPrice: null,
      available: false,
      variants: [],
      images: p.images.map((img) => ({ src: img.src, alt: img.alt ?? undefined })),
      tags: p.tags,
      productType: p.product_type,
      vendor: p.vendor,
    });
  }

  return results;
}

export function transformPriceRule(rule: PriceRule): TransformedPromo {
  const startsAt = rule.starts_at ? new Date(rule.starts_at) : null;
  const endsAt = rule.ends_at ? new Date(rule.ends_at) : null;
  const now = new Date();
  const active =
    (!startsAt || startsAt <= now) && (!endsAt || endsAt >= now);

  let discountType: "percentage" | "fixed" | "bogo" | "bundle" = "percentage";
  if (rule.value_type === "fixed_amount") discountType = "fixed";

  return {
    name: rule.title,
    discountType,
    discountValue: rule.value,
    startDate: startsAt,
    endDate: endsAt,
    active,
  };
}
