"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useTRPC } from "@/src/lib/trpc/client";
import type { RouterOutputs } from "@/src/server/trpc/routers/root";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileJson, Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductDialog } from "./product-dialog";
import { JsonImportDialog } from "./json-import-dialog";
import { cn } from "@/lib/utils";

type StoreProduct = RouterOutputs["ownStore"]["products"]["list"][number];

interface ProductsTableProps {
  workspaceId: string;
}

function formatPrice(value: string) {
  const n = parseFloat(value);
  return isNaN(n) ? value : `$${n.toFixed(2)}`;
}

function ProductAvatar({ product }: { product: StoreProduct }) {
  const images = product.images as { src: string; alt?: string }[] | null;
  const firstImage = Array.isArray(images) ? images[0] : null;

  if (firstImage?.src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={firstImage.src}
        alt={firstImage.alt ?? product.name}
        className="h-7 w-7 shrink-0 rounded-md object-cover ring-1 ring-slate-200"
      />
    );
  }
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 ring-1 ring-slate-200">
      <Package className="h-3.5 w-3.5 text-slate-400" />
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <tr key={i} className="border-b border-slate-100">
          <td className="px-5 py-3.5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-7 shrink-0 rounded-md" />
              <Skeleton className="h-4 w-40" />
            </div>
          </td>
          <td className="px-5 py-3.5"><Skeleton className="h-4 w-20" /></td>
          <td className="px-5 py-3.5"><Skeleton className="h-4 w-16" /></td>
          <td className="px-5 py-3.5"><Skeleton className="h-4 w-16" /></td>
          <td className="px-5 py-3.5"><Skeleton className="h-5 w-20 rounded-full" /></td>
          <td className="px-5 py-3.5" />
        </tr>
      ))}
    </>
  );
}

export function ProductsTable({ workspaceId }: ProductsTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<StoreProduct | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: products = [], isLoading } = useQuery({
    ...trpc.ownStore.products.list.queryOptions({ workspaceId }),
    enabled: !!workspaceId,
  });

  const deleteMutation = useMutation(
    trpc.ownStore.products.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.ownStore.products.list.queryFilter({ workspaceId }));
        toast({ title: "Product removed", description: "Product has been removed from your store." });
        setDeleteDialogOpen(false);
        setProductToDelete(null);
      },
      onError: (error) => {
        toast({ title: "Error", description: error.message ?? "Failed to remove product", variant: "destructive" });
      },
    })
  );

  const handleEdit = (product: StoreProduct) => {
    setEditingProduct(product);
    setProductDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setProductDialogOpen(true);
  };

  const handleDeleteClick = (product: StoreProduct) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleProductDialogClose = () => {
    setProductDialogOpen(false);
    setEditingProduct(null);
  };

  const filtered = products.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.externalId?.toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-4 border-b border-slate-100 px-5 py-3">
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="ml-auto h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
        <table className="w-full">
          <tbody><SkeletonRows /></tbody>
        </table>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="space-y-3">
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Add products manually or import them directly from your Shopify store."
          action={{ label: "Add product", onClick: handleAdd }}
        />
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportDialogOpen(true)}
            className="gap-2 text-slate-500"
          >
            <FileJson className="h-3.5 w-3.5" />
            Import from JSON
          </Button>
        </div>
        <ProductDialog workspaceId={workspaceId} open={productDialogOpen} onOpenChange={handleProductDialogClose} product={editingProduct} />
        <JsonImportDialog workspaceId={workspaceId} open={importDialogOpen} onOpenChange={setImportDialogOpen} />
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3">
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 rounded-lg pl-8 text-sm"
            />
          </div>
          <span className="text-xs tabular-nums text-slate-400">
            {filtered.length} {filtered.length === 1 ? "product" : "products"}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportDialogOpen(true)}
              className="h-8 gap-1.5 text-xs"
            >
              <FileJson className="h-3.5 w-3.5" />
              Import from JSON
            </Button>
            <Button size="sm" onClick={handleAdd} className="h-8 gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Add product
            </Button>
          </div>
        </div>

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Product
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                SKU
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Price
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Compare-at
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Status
              </th>
              <th className="w-20 px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">
                  No products match your search.
                </td>
              </tr>
            ) : (
              filtered.map((product) => (
                <tr key={product.id} className="group transition-colors hover:bg-slate-50/60">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <ProductAvatar product={product} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{product.name}</p>
                        {(product as { vendor?: string }).vendor && (
                          <p className="truncate text-xs text-slate-400">
                            {(product as { vendor?: string }).vendor}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs text-slate-500">{product.externalId || "—"}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-medium text-slate-900">{formatPrice(product.price)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-slate-400">
                      {product.compareAtPrice ? formatPrice(product.compareAtPrice) : "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                        product.available
                          ? "bg-green-50 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          product.available ? "bg-green-500" : "bg-slate-400"
                        )}
                      />
                      {product.available ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-slate-700"
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleDeleteClick(product)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ProductDialog
        workspaceId={workspaceId}
        open={productDialogOpen}
        onOpenChange={handleProductDialogClose}
        product={editingProduct}
      />

      <JsonImportDialog
        workspaceId={workspaceId}
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove product</DialogTitle>
            <DialogDescription>
              {`Are you sure you want to remove "${productToDelete?.name}"? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => productToDelete && deleteMutation.mutate({ workspaceId, id: productToDelete.id })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
