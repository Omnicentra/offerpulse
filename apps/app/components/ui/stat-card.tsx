import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: {
    value: string;
    trend: "up" | "down" | "neutral";
  };
  icon?: LucideIcon;
  iconColor?: string;
}

export function StatCard({ label, value, change, icon: Icon, iconColor }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          {change && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={cn(
                  "text-sm font-medium",
                  change.trend === "up" && "text-green-600",
                  change.trend === "down" && "text-red-600",
                  change.trend === "neutral" && "text-slate-600"
                )}
              >
                {change.value}
              </span>
              <span className="text-sm text-slate-500">vs last week</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("rounded-xl p-3", iconColor || "bg-blue-100")}>
            <Icon className={cn("h-5 w-5", iconColor ? "text-current" : "text-blue-600")} />
          </div>
        )}
      </div>
    </div>
  );
}
