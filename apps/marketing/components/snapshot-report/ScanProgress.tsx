import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2 } from "lucide-react";

const scanSteps = [
  { id: 1, label: "Discovering domain pages...", duration: 3500 },
  { id: 2, label: "Filtering relevant pages...", duration: 1500 },
  { id: 3, label: "Scraping 15-20 pages in parallel...", duration: 35000 },
  { id: 4, label: "Extracting offers from each page...", duration: 4000 },
  { id: 5, label: "Aggregating and deduplicating offers...", duration: 2200 },
  { id: 6, label: "Building your comprehensive report...", duration: 2500 },
];

export function ScanProgress() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    let elapsed = 0;

    scanSteps.forEach((step, index) => {
      elapsed += scanSteps[index - 1]?.duration || 0;
      const timer = setTimeout(() => {
        setCurrentStep(index);
      }, elapsed);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardContent className="p-12">
        <div className="mx-auto max-w-md space-y-6">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
            <h3 className="mt-4 text-xl font-semibold text-slate-900">
              Analysing competitor store...
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Scanning multiple pages for comprehensive offer detection
            </p>
          </div>

          <div className="space-y-3">
            {scanSteps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 rounded-lg p-3 transition-all ${
                  index <= currentStep
                    ? "bg-white shadow-sm"
                    : "bg-slate-50/50"
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                ) : index === currentStep ? (
                  <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-blue-600" />
                ) : (
                  <div className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-slate-300" />
                )}
                <span
                  className={`text-sm ${
                    index <= currentStep ? "font-medium text-slate-900" : "text-slate-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
