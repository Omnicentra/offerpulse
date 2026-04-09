import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Matches Alerts-style headers: `text-2xl` only, tighter description spacing */
  compact?: boolean;
}

export function PageHeader({
  title,
  description,
  action,
  compact,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between",
        compact ? "mb-6" : "mb-8"
      )}
    >
      <div>
        <h1
          className={cn(
            "font-bold text-slate-900",
            compact ? "text-2xl" : "text-2xl tracking-tight sm:text-3xl"
          )}
        >
          {title}
        </h1>
        {description && (
          <p
            className={cn(
              "text-sm text-slate-600",
              compact ? "mt-1" : "mt-2"
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
