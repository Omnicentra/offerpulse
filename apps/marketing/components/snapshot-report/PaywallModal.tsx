import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Lock, CheckCircle, Sparkles } from "lucide-react";

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
}

export function PaywallModal({ open, onOpenChange, feature }: PaywallModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <DialogTitle className="text-center">Unlock Full Report</DialogTitle>
          <DialogDescription className="text-center">
            You've seen ~20% of what we detected
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-slate-700">
            <strong>{feature}</strong> is available with monitoring.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
              <span className="text-sm text-slate-700">
                See exact codes, thresholds, gifts, and bundles
              </span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
              <span className="text-sm text-slate-700">
                See checkout-only incentives price trackers miss
              </span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
              <span className="text-sm text-slate-700">
                Track changes + get instant alerts
              </span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
              <span className="text-sm text-slate-700">
                Export PDF reports
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button asChild size="lg" className="w-full">
              <Link href="/?utm_source=snapshot_paywall&utm_medium=modal">
                <Sparkles className="mr-2 h-5 w-5" />
                Start monitoring (14-day trial)
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>

          <p className="text-center text-xs text-slate-500">
            From £19/mo • No credit card for trial
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
