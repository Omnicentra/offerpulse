/**
 * Fetch products from Shopify's public products.json endpoint.
 * No auth required - public storefront data.
 */

import { logger } from "@offerpulse/lib";

export interface ProductsJsonVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  available: boolean;
  sku?: string;
  option1?: string;
  option2?: string;
  option3?: string;
}

export interface ProductsJsonProduct {
  id: number;
  title: string;
  body_html: string | null;
  vendor: string | null;
  product_type: string | null;
  created_at: string;
  updated_at: string;
  variants: ProductsJsonVariant[];
  images: Array<{ id: number; src: string; alt: string | null }>;
  tags: string[];
}

export interface ProductsJsonResponse {
  products: ProductsJsonProduct[];
}

const LIMIT = 250;

export async function fetchAllProductsJson(
  shopDomain: string
): Promise<ProductsJsonProduct[]> {
  const allProducts: ProductsJsonProduct[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = `https://${shopDomain}/products.json?limit=${LIMIT}&page=${page}`;
    const response = await fetch(url);

    const contentType = response.headers.get("content-type") || "";
    
    logger.debug("[fetchAllProductsJson] response received", {
      shopDomain,
      page,
      status: response.status,
      statusText: response.statusText,
      contentType,
    });

    if (!response.ok) {
      const bodyPreview = await response.text();
      logger.error("[fetchAllProductsJson] non-ok response", {
        shopDomain,
        status: response.status,
        contentType,
        bodyPreview: bodyPreview.slice(0, 200),
      });
      throw new Error(
        `Products.json fetch failed: ${response.status} ${response.statusText}. ` +
        `Content-Type: ${contentType}. Body preview: ${bodyPreview.slice(0, 100)}`
      );
    }

    if (!contentType.includes("application/json")) {
      const bodyPreview = await response.text();
      logger.error("[fetchAllProductsJson] non-JSON response", {
        shopDomain,
        contentType,
        bodyPreview: bodyPreview.slice(0, 200),
      });
      throw new Error(
        `Expected JSON but got ${contentType}. ` +
        `This usually means the store is password-protected, doesn't exist, or is in maintenance mode. ` +
        `Body preview: ${bodyPreview.slice(0, 100)}`
      );
    }

    const data = (await response.json()) as ProductsJsonResponse;
    allProducts.push(...data.products);

    if (data.products.length < LIMIT) {
      hasMore = false;
    } else {
      page++;
    }
  }

  return allProducts;
}
