"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useTRPC } from "@/src/lib/trpc/client";
import type { RouterOutputs } from "@/src/server/trpc/routers/root";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileJson, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
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

interface ProductsTableProps {
  workspaceId: string;
}

export function ProductsTable({ workspaceId }: ProductsTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<
    RouterOutputs["ownStore"]["products"]["list"][number] | null
  >(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<
    RouterOutputs["ownStore"]["products"]["list"][number] | null
  >(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    ...trpc.ownStore.products.list.queryOptions({ workspaceId }),
    enabled: !!workspaceId,
  });

  const deleteMutation = useMutation(
    trpc.ownStore.products.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.ownStore.products.list.queryFilter({ workspaceId })
        );
        toast({ title: "Product removed", description: "Product has been removed from your store." });
        setDeleteDialogOpen(false);
        setProductToDelete(null);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message ?? "Failed to remove product",
          variant: "destructive",
        });
      },
    })
  );

  const handleEdit = (product: RouterOutputs["ownStore"]["products"]["list"][number]) => {
    setEditingProduct(product);
    setProductDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setProductDialogOpen(true);
  };

  const handleDeleteClick = (product: RouterOutputs["ownStore"]["products"]["list"][number]) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleProductDialogClose = () => {
    setProductDialogOpen(false);
    setEditingProduct(null);
  };

  const formatPrice = (value: string) => {
    const n = parseFloat(value);
    return isNaN(n) ? value : n.toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <p className="text-sm text-slate-500">Loading products...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={Plus}
          title="No products yet"
          description="Add products manually or import them from your Shopify store."
          action={{ label: "Add product", onClick: handleAdd }}
        />
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportDialogOpen(true)}
            className="gap-2 text-slate-600"
          >
            <FileJson className="h-4 w-4" />
            Import from JSON
          </Button>
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
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setImportDialogOpen(true)}
          className="gap-2"
        >
          <FileJson className="h-4 w-4" />
          Import from JSON
        </Button>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add product
        </Button>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Compare-at</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-slate-600">{product.externalId}</TableCell>
                <TableCell>{formatPrice(product.price)}</TableCell>
                <TableCell className="text-slate-600">
                  {product.compareAtPrice ? formatPrice(product.compareAtPrice) : "—"}
                </TableCell>
                <TableCell>
                  <span
                    className={
                      product.available
                        ? "text-green-600"
                        : "text-slate-500"
                    }
                  >
                    {product.available ? "Available" : "Unavailable"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(product)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ProductDialog
        workspaceId={workspaceId}
        open={productDialogOpen}
        onOpenChange={handleProductDialogClose}
        product={editingProduct}
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
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                productToDelete &&
                deleteMutation.mutate({ workspaceId, id: productToDelete.id })
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <JsonImportDialog
        workspaceId={workspaceId}
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
    </div>
  );
}
