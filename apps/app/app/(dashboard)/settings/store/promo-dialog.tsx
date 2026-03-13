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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StorePromo = RouterOutputs["ownStore"]["promos"]["list"][number];

const DISCOUNT_TYPES = [
  { value: "percentage", label: "Percentage off" },
  { value: "fixed", label: "Fixed amount off" },
  { value: "bogo", label: "Buy one get one" },
  { value: "bundle", label: "Bundle deal" },
] as const;

interface PromoDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promo?: StorePromo | null;
}

export function PromoDialog({
  workspaceId,
  open,
  onOpenChange,
  promo,
}: PromoDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const isEdit = !!promo;

  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed" | "bogo" | "bundle">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (open) {
      if (promo) {
        setName(promo.name);
        setDiscountType(promo.discountType);
        setDiscountValue(promo.discountValue ?? "");
        setActive(promo.active);
      } else {
        setName("");
        setDiscountType("percentage");
        setDiscountValue("");
        setActive(true);
      }
    }
  }, [open, promo]);

  const createMutation = useMutation(
    trpc.ownStore.promos.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.ownStore.promos.list.queryFilter({ workspaceId })
        );
        toast({ title: "Promo added", description: "Promotion has been added." });
        onOpenChange(false);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message ?? "Failed to add promo",
          variant: "destructive",
        });
      },
    })
  );

  const updateMutation = useMutation(
    trpc.ownStore.promos.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.ownStore.promos.list.queryFilter({ workspaceId })
        );
        toast({ title: "Promo updated", description: "Promotion has been updated." });
        onOpenChange(false);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message ?? "Failed to update promo",
          variant: "destructive",
        });
      },
    })
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const valueNum = discountValue.trim() ? parseFloat(discountValue) : undefined;
    if (valueNum !== undefined && (isNaN(valueNum) || valueNum < 0)) {
      toast({ title: "Invalid discount value", variant: "destructive" });
      return;
    }

    if (isEdit) {
      updateMutation.mutate({
        workspaceId,
        id: promo.id,
        name: name.trim(),
        discountType,
        discountValue: discountValue.trim() || null,
        active,
      });
    } else {
      createMutation.mutate({
        workspaceId,
        name: name.trim(),
        discountType,
        discountValue: discountValue.trim() || null,
        active,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit promotion" : "Add promotion"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update promotion details below."
              : "Add a promotion to include in AI recommendations."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="promo-name">Promotion name</Label>
            <Input
              id="promo-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Sale 20% Off"
              required
            />
          </div>
          <div>
            <Label htmlFor="promo-type">Discount type</Label>
            <Select
              value={discountType}
              onValueChange={(v) => setDiscountType(v as typeof discountType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISCOUNT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(discountType === "percentage" || discountType === "fixed") && (
            <div>
              <Label htmlFor="promo-value">
                {discountType === "percentage" ? "Percentage" : "Amount"}
              </Label>
              <Input
                id="promo-value"
                type="text"
                inputMode="decimal"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "percentage" ? "20" : "5.00"}
              />
            </div>
          )}
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            <span className="text-sm font-medium">Active</span>
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
              {isPending ? "Saving..." : isEdit ? "Update" : "Add promo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
