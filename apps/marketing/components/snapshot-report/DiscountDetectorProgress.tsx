"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2 } from "lucide-react";

const steps = [
  { id: 1, label: "Mapping store URLs…", duration: 2500 },
  { id: 2, label: "Scraping prioritized pages…", duration: 4000 },
  { id: 3, label: "Scanning for discount messaging…", duration: 2200 },
  { id: 4, label: "Checking structured data…", duration: 1400 },
  { id: 5, label: "Building your report…", duration: 1200 },
];

export function DiscountDetectorProgress() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 0;

    steps.forEach((_, index) => {
      elapsed += steps[index - 1]?.duration ?? 0;
      const timer = setTimeout(() => {
        setCurrentStep(index);
      }, elapsed);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-white">
      <CardContent className="p-12">
        <div className="mx-auto max-w-md space-y-6">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-violet-600" />
            <h3 className="mt-4 text-xl font-semibold text-slate-900">
              Scanning for discounts…
            </h3>
          </div>
          <ul className="space-y-3">
            {steps.map((step, index) => (
              <li
                key={step.id}
                className={`flex items-center gap-3 text-sm ${
                  index === currentStep
                    ? "font-medium text-violet-800"
                    : index < currentStep
                      ? "text-slate-500"
                      : "text-slate-400"
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                ) : index === currentStep ? (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-violet-600" />
                ) : (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-200 text-xs text-slate-400">
                    {index + 1}
                  </span>
                )}
                {step.label}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
