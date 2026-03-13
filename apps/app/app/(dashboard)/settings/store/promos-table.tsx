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
import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PromoDialog } from "./promo-dialog";

interface PromosTableProps {
  workspaceId: string;
}

function formatDiscount(promo: RouterOutputs["ownStore"]["promos"]["list"][number]) {
  if (promo.discountType === "percentage" && promo.discountValue) {
    return `${promo.discountValue}% off`;
  }
  if (promo.discountType === "fixed" && promo.discountValue) {
    return `${promo.discountValue} off`;
  }
  if (promo.discountType === "bogo") return "BOGO";
  if (promo.discountType === "bundle") return "Bundle";
  return promo.discountType;
}

export function PromosTable({ workspaceId }: PromosTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const [promoDialogOpen, setPromoDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<
    RouterOutputs["ownStore"]["promos"]["list"][number] | null
  >(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promoToDelete, setPromoToDelete] = useState<
    RouterOutputs["ownStore"]["promos"]["list"][number] | null
  >(null);

  const { data: promos = [], isLoading } = useQuery({
    ...trpc.ownStore.promos.list.queryOptions({ workspaceId }),
    enabled: !!workspaceId,
  });

  const deleteMutation = useMutation(
    trpc.ownStore.promos.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.ownStore.promos.list.queryFilter({ workspaceId })
        );
        toast({ title: "Promo removed", description: "Promotion has been removed." });
        setDeleteDialogOpen(false);
        setPromoToDelete(null);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message ?? "Failed to remove promo",
          variant: "destructive",
        });
      },
    })
  );

  const handleEdit = (promo: RouterOutputs["ownStore"]["promos"]["list"][number]) => {
    setEditingPromo(promo);
    setPromoDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingPromo(null);
    setPromoDialogOpen(true);
  };

  const handleDeleteClick = (promo: RouterOutputs["ownStore"]["promos"]["list"][number]) => {
    setPromoToDelete(promo);
    setDeleteDialogOpen(true);
  };

  const handlePromoDialogClose = () => {
    setPromoDialogOpen(false);
    setEditingPromo(null);
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <p className="text-sm text-slate-500">Loading promotions...</p>
      </div>
    );
  }

  if (promos.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={Tag}
          title="No promotions yet"
          description="Add promotions so AI recommendations can compare your offers against competitors."
          action={{ label: "Add promotion", onClick: handleAdd }}
        />
        <PromoDialog
          workspaceId={workspaceId}
          open={promoDialogOpen}
          onOpenChange={handlePromoDialogClose}
          promo={editingPromo}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add promotion
        </Button>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promos.map((promo) => (
              <TableRow key={promo.id}>
                <TableCell className="font-medium">{promo.name}</TableCell>
                <TableCell>{formatDiscount(promo)}</TableCell>
                <TableCell>
                  <span
                    className={
                      promo.active ? "text-green-600" : "text-slate-500"
                    }
                  >
                    {promo.active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(promo)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(promo)}
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

      <PromoDialog
        workspaceId={workspaceId}
        open={promoDialogOpen}
        onOpenChange={handlePromoDialogClose}
        promo={editingPromo}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove promotion</DialogTitle>
            <DialogDescription>
              {`Are you sure you want to remove "${promoToDelete?.name}"? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                promoToDelete &&
                deleteMutation.mutate({ workspaceId, id: promoToDelete.id })
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
