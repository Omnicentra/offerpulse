"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/src/lib/trpc/client";
import { formatPrice, type PricingPlan } from "@offerpulse/lib/pricing";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export interface PlanChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlanName: string;
  targetPlan: PricingPlan | null;
  effectiveDate: Date;
  billingInterval: "month" | "year";
}

export function PlanChangeDialog({
  open,
  onOpenChange,
  currentPlanName,
  targetPlan,
  effectiveDate,
  billingInterval,
}: PlanChangeDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();

  const changePlanMutation = useMutation(
    trpc.billing.changeSubscriptionPlan.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.billing.getSubscription.queryKey(),
        });
        toast({
          title: "Plan change scheduled",
          description:
            "Your new plan will start at the end of your current billing period.",
        });
        onOpenChange(false);
        router.refresh();
      },
    })
  );

  const newAmountLabel =
    billingInterval === "year"
      ? `${formatPrice(targetPlan?.yearlyPrice ?? 0)}/yr`
      : `${formatPrice(targetPlan?.monthlyPrice ?? 0)}/mo`;

  const handleConfirm = () => {
    if (!targetPlan) return;
    changePlanMutation.mutate({ planId: targetPlan.id });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showClose={!changePlanMutation.isPending}>
        <DialogHeader>
          <DialogTitle>Confirm plan change</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-4 pt-2 text-left text-sm text-body">
              <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-4 text-base font-medium text-ink sm:justify-start">
                <span>{currentPlanName}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span>{targetPlan?.name ?? "—"}</span>
              </div>
              <p>
                <span className="font-medium text-ink">Takes effect on: </span>
                {effectiveDate.toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p>
                <span className="font-medium text-ink">New amount: </span>
                {newAmountLabel} from that date (same billing cadence as today).
              </p>
              <p className="rounded-lg border border-border bg-surface px-3 py-2 text-muted-foreground">
                No charges today — your current plan stays in place until the date above. The
                switch is scheduled at the end of your current billing period.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={changePlanMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={changePlanMutation.isPending || !targetPlan}
          >
            {changePlanMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scheduling…
              </>
            ) : (
              "Confirm change"
            )}
          </Button>
        </DialogFooter>
        {changePlanMutation.isError ? (
          <p className="text-center text-sm text-destructive" role="alert">
            {changePlanMutation.error.message}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
