import { Badge } from "./badge";
import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
  confidence: "low" | "medium" | "high";
  className?: string;
}

export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  const variants = {
    low: "bg-yellow-100 text-yellow-800 border-yellow-200",
    medium: "bg-blue-100 text-blue-800 border-blue-200",
    high: "bg-green-100 text-green-800 border-green-200",
  };

  return (
    <Badge variant="outline" className={cn(variants[confidence], className)}>
      {confidence}
    </Badge>
  );
}
