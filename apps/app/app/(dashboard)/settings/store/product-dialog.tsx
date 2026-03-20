"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Form reset when dialog opens */
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTRPC } from "@/src/lib/trpc/client";
import type { RouterOutputs } from "@/src/server/trpc/routers/root";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

type StoreProduct = RouterOutputs["ownStore"]["products"]["list"][number];

interface ProductDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: StoreProduct | null;
}

export function ProductDialog({
  workspaceId,
  open,
  onOpenChange,
  product,
}: ProductDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const isEdit = !!product;

  const [name, setName] = useState("");
  const [externalId, setExternalId] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    if (open) {
      if (product) {
        setName(product.name);
        setExternalId(product.externalId);
        setPrice(product.price);
        setCompareAtPrice(product.compareAtPrice ?? "");
        setAvailable(product.available);
      } else {
        setName("");
        setExternalId("");
        setPrice("");
        setCompareAtPrice("");
        setAvailable(true);
      }
    }
  }, [open, product]);

  const createMutation = useMutation(
    trpc.ownStore.products.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.ownStore.products.list.queryFilter({ workspaceId })
        );
        toast({ title: "Product added", description: "Product has been added to your store." });
        onOpenChange(false);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message ?? "Failed to add product",
          variant: "destructive",
        });
      },
    })
  );

  const updateMutation = useMutation(
    trpc.ownStore.products.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.ownStore.products.list.queryFilter({ workspaceId })
        );
        toast({ title: "Product updated", description: "Product has been updated." });
        onOpenChange(false);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message ?? "Failed to update product",
          variant: "destructive",
        });
      },
    })
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price.trim()) return;

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      toast({ title: "Invalid price", variant: "destructive" });
      return;
    }

    const compareNum = compareAtPrice.trim()
      ? parseFloat(compareAtPrice)
      : undefined;
    if (compareNum !== undefined && (isNaN(compareNum) || compareNum < 0)) {
      toast({ title: "Invalid compare-at price", variant: "destructive" });
      return;
    }

    if (isEdit) {
      updateMutation.mutate({
        workspaceId,
        id: product.id,
        name: name.trim(),
        externalId: externalId.trim() || undefined,
        price: price,
        compareAtPrice: compareAtPrice.trim() || null,
        available,
      });
    } else {
      createMutation.mutate({
        workspaceId,
        name: name.trim(),
        externalId: externalId.trim() || undefined,
        price: price,
        compareAtPrice: compareAtPrice.trim() || null,
        available,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit product" : "Add product"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update product details below."
              : "Add a product to compare against competitor offers."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="product-name">Product name</Label>
            <Input
              id="product-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. iPhone 15 Case"
              required
            />
          </div>
          <div>
            <Label htmlFor="product-sku">SKU / External ID (optional)</Label>
            <Input
              id="product-sku"
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
              placeholder="e.g. CASE-001"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product-price">Price</Label>
              <Input
                id="product-price"
                type="text"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="29.99"
                required
              />
            </div>
            <div>
              <Label htmlFor="product-compare">Compare-at price (optional)</Label>
              <Input
                id="product-compare"
                type="text"
                inputMode="decimal"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                placeholder="39.99"
              />
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            <span className="text-sm font-medium">Available for sale</span>
          </label>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Update" : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
