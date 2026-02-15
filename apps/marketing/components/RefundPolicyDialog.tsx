"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";

interface RefundPolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RefundPolicyDialog({ open, onOpenChange }: RefundPolicyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Refund Policy</DialogTitle>
          <DialogDescription>
            Early Access Deposit - Clear, simple terms
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Main Promise */}
          <div className="rounded-lg bg-green-50 p-6">
            <div className="flex gap-3">
              <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">100% refundable before launch</p>
                <p className="mt-2 text-sm text-green-800">
                  Your £19 deposit is fully refundable at any time before OfferPulse launches to general availability.
                  No questions asked.
                </p>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div>
            <h3 className="mb-4 font-semibold text-slate-900">How the deposit works</h3>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                  1
                </span>
                <p>
                  <strong>You pay £19</strong> to reserve your early access slot and get your first manual competitor
                  offer report.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                  2
                </span>
                <p>
                  <strong>We deliver your report</strong> within 2 working days. This is manually generated while we
                  validate demand.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                  3
                </span>
                <p>
                  <strong>When we launch</strong> automated monitoring, your £19 is credited to your first paid month.
                  You don't pay twice.
                </p>
              </div>
            </div>
          </div>

          {/* Refund Conditions */}
          <div>
            <h3 className="mb-4 font-semibold text-slate-900">When you can request a refund</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex gap-2">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
                <span>
                  <strong>Before launch:</strong> Anytime, for any reason. Reply to your confirmation email or email{" "}
                  <a href="mailto:support@offerpulse.io" className="text-blue-600 hover:underline">
                    support@offerpulse.io
                  </a>
                </span>
              </li>
              <li className="flex gap-2">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
                <span>
                  <strong>After receiving your report:</strong> If the report doesn't match what we promised (full
                  promo stack, evidence, codes/thresholds, suggested actions), we refund immediately.
                </span>
              </li>
              <li className="flex gap-2">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
                <span>
                  <strong>After launch:</strong> Your £19 becomes a credit. If you don't want to continue with paid
                  monitoring, we refund the unused credit.
                </span>
              </li>
            </ul>
          </div>

          {/* Refund Process */}
          <div>
            <h3 className="mb-4 font-semibold text-slate-900">How to request a refund</h3>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p>
                Email{" "}
                <a href="mailto:support@offerpulse.io" className="font-medium text-blue-600 hover:underline">
                  support@offerpulse.io
                </a>{" "}
                with the subject "Refund request" and your email address used for payment. We process refunds within 2
                business days to your original payment method.
              </p>
            </div>
          </div>

          {/* What's Not Refundable */}
          <div>
            <h3 className="mb-4 font-semibold text-slate-900">What's not covered</h3>
            <p className="text-sm text-slate-700">
              Once you've actively used OfferPulse for monitoring (after launch) and received ongoing alerts/reports for
              30+ days, standard subscription terms apply. The deposit credit is non-refundable after that point, but you
              can cancel your subscription anytime without penalty.
            </p>
          </div>

          {/* Bottom Line */}
          <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
            <p className="font-semibold text-blue-900">Bottom line:</p>
            <p className="mt-2 text-sm text-blue-800">
              We want you to feel confident reserving early access. If OfferPulse doesn't deliver what we promised, or if
              you change your mind before launch, you get your money back. Simple as that.
            </p>
          </div>

          <p className="text-center text-xs text-slate-500">
            Questions? Email{" "}
            <a href="mailto:support@offerpulse.io" className="text-blue-600 hover:underline">
              support@offerpulse.io
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
