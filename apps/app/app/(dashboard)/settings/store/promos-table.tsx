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
import { Pencil, Plus, Search, Tag, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PromoDialog } from "./promo-dialog";
import { cn } from "@/lib/utils";

type StorePromo = RouterOutputs["ownStore"]["promos"]["list"][number];

interface PromosTableProps {
  workspaceId: string;
}

const DISCOUNT_STYLES: Record<string, { label: string; className: string }> = {
  percentage: { label: "% off", className: "bg-blue-50 text-blue-700" },
  fixed: { label: "fixed", className: "bg-violet-50 text-violet-700" },
  bogo: { label: "BOGO", className: "bg-orange-50 text-orange-700" },
  bundle: { label: "Bundle", className: "bg-teal-50 text-teal-700" },
};

function DiscountTag({ promo }: { promo: StorePromo }) {
  const style = DISCOUNT_STYLES[promo.discountType] ?? { label: promo.discountType, className: "bg-slate-100 text-slate-600" };

  let label = style.label;
  if (promo.discountType === "percentage" && promo.discountValue) {
    label = `${promo.discountValue}% off`;
  } else if (promo.discountType === "fixed" && promo.discountValue) {
    label = `$${promo.discountValue} off`;
  } else if (promo.discountType === "bogo") {
    label = "BOGO";
  } else if (promo.discountType === "bundle") {
    label = "Bundle";
  }

  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", style.className)}>
      {label}
    </span>
  );
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <tr key={i} className="border-b border-slate-100">
          <td className="px-5 py-3.5"><Skeleton className="h-4 w-40" /></td>
          <td className="px-5 py-3.5"><Skeleton className="h-5 w-16 rounded-md" /></td>
          <td className="px-5 py-3.5"><Skeleton className="h-4 w-28" /></td>
          <td className="px-5 py-3.5"><Skeleton className="h-5 w-20 rounded-full" /></td>
          <td className="px-5 py-3.5" />
        </tr>
      ))}
    </>
  );
}

export function PromosTable({ workspaceId }: PromosTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const [promoDialogOpen, setPromoDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<StorePromo | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promoToDelete, setPromoToDelete] = useState<StorePromo | null>(null);
  const [search, setSearch] = useState("");

  const { data: promos = [], isLoading } = useQuery({
    ...trpc.ownStore.promos.list.queryOptions({ workspaceId }),
    enabled: !!workspaceId,
  });

  const deleteMutation = useMutation(
    trpc.ownStore.promos.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.ownStore.promos.list.queryFilter({ workspaceId }));
        toast({ title: "Promo removed", description: "Promotion has been removed." });
        setDeleteDialogOpen(false);
        setPromoToDelete(null);
      },
      onError: (error) => {
        toast({ title: "Error", description: error.message ?? "Failed to remove promo", variant: "destructive" });
      },
    })
  );

  const handleEdit = (promo: StorePromo) => {
    setEditingPromo(promo);
    setPromoDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingPromo(null);
    setPromoDialogOpen(true);
  };

  const handleDeleteClick = (promo: StorePromo) => {
    setPromoToDelete(promo);
    setDeleteDialogOpen(true);
  };

  const handlePromoDialogClose = () => {
    setPromoDialogOpen(false);
    setEditingPromo(null);
  };

  const filtered = promos.filter((p) => {
    if (!search.trim()) return true;
    return p.name.toLowerCase().includes(search.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-4 border-b border-slate-100 px-5 py-3">
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="ml-auto h-8 w-32 rounded-lg" />
        </div>
        <table className="w-full">
          <tbody><SkeletonRows /></tbody>
        </table>
      </div>
    );
  }

  if (promos.length === 0) {
    return (
      <div>
        <EmptyState
          icon={Tag}
          title="No promotions yet"
          description="Add promotions so AI recommendations can compare your offers against competitors."
          action={{ label: "Add promotion", onClick: handleAdd }}
        />
        <PromoDialog workspaceId={workspaceId} open={promoDialogOpen} onOpenChange={handlePromoDialogClose} promo={editingPromo} />
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
              placeholder="Search promotions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 rounded-lg pl-8 text-sm"
            />
          </div>
          <span className="text-xs tabular-nums text-slate-400">
            {filtered.length} {filtered.length === 1 ? "promotion" : "promotions"}
          </span>
          <div className="ml-auto">
            <Button size="sm" onClick={handleAdd} className="h-8 gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Add promotion
            </Button>
          </div>
        </div>

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Promotion
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Discount
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Period
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
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">
                  No promotions match your search.
                </td>
              </tr>
            ) : (
              filtered.map((promo) => {
                const start = formatDate(promo.startDate);
                const end = formatDate(promo.endDate);
                const period = start && end ? `${start} – ${end}` : start ? `From ${start}` : end ? `Until ${end}` : null;

                return (
                  <tr key={promo.id} className="group transition-colors hover:bg-slate-50/60">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{promo.name}</p>
                        {promo.description && (
                          <p className="mt-0.5 max-w-xs truncate text-xs text-slate-400">{promo.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <DiscountTag promo={promo} />
                    </td>
                    <td className="px-5 py-3.5">
                      {period ? (
                        <span className="text-xs text-slate-500">{period}</span>
                      ) : (
                        <span className="text-xs text-slate-300">No dates set</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                          promo.active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            promo.active ? "bg-green-500" : "bg-slate-400"
                          )}
                        />
                        {promo.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-slate-700"
                          onClick={() => handleEdit(promo)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDeleteClick(promo)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => promoToDelete && deleteMutation.mutate({ workspaceId, id: promoToDelete.id })}
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
