import * as React from "react";
import { cn } from "@offerpulse/lib/utils";

const badgeVariants = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-muted text-muted-foreground",
  success: "bg-mint-tint text-mint",
  warning: "bg-amber-tint text-amber",
  destructive: "bg-destructive/10 text-destructive",
  outline: "border border-border bg-surface",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
