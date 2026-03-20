export type HistoryField = "price" | "compareAtPrice" | "available" | "variants";

export interface ProductChange {
  field: HistoryField;
  oldValue: unknown;
  newValue: unknown;
}

export interface ExistingProduct {
  id: string;
  externalId: string;
  price: string;
  compareAtPrice: string | null;
  available: boolean;
  variants: unknown[];
}

export interface NewProduct {
  externalId: string;
  price: string;
  compareAtPrice: string | null;
  available: boolean;
  variants: unknown[];
}

export function detectProductChanges(
  existing: ExistingProduct,
  incoming: NewProduct
): ProductChange[] {
  const changes: ProductChange[] = [];

  if (existing.price !== incoming.price) {
    changes.push({
      field: "price",
      oldValue: existing.price,
      newValue: incoming.price,
    });
  }

  const existingCompare = existing.compareAtPrice ?? null;
  const incomingCompare = incoming.compareAtPrice ?? null;
  if (String(existingCompare) !== String(incomingCompare)) {
    changes.push({
      field: "compareAtPrice",
      oldValue: existingCompare,
      newValue: incomingCompare,
    });
  }

  if (existing.available !== incoming.available) {
    changes.push({
      field: "available",
      oldValue: existing.available,
      newValue: incoming.available,
    });
  }

  const existingVariants = JSON.stringify(existing.variants ?? []);
  const incomingVariants = JSON.stringify(incoming.variants ?? []);
  if (existingVariants !== incomingVariants) {
    changes.push({
      field: "variants",
      oldValue: existing.variants,
      newValue: incoming.variants,
    });
  }

  return changes;
}
