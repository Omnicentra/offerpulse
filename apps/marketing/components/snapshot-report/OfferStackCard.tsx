import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle } from "lucide-react";

interface OfferItem {
  text: string;
  location: string;
  evidenceText?: string;
}

interface OfferStackCardProps {
  category: string;
  items: OfferItem[];
  icon: React.ComponentType<{ className?: string }>;
  emptyMessage?: string;
}

export function OfferStackCard({ category, items, icon: Icon, emptyMessage }: OfferStackCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>
          <CardTitle className="text-lg">
            {category}
            {items.length > 0 && <span className="ml-2 text-sm font-normal text-slate-500">({items.length})</span>}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{item.text}</p>
                  {item.evidenceText && (
                    <p className="mt-1 text-xs text-slate-600">"{item.evidenceText}"</p>
                  )}
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      {item.location}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            <Circle className="h-4 w-4 text-slate-400" />
            {emptyMessage || `No ${category.toLowerCase()} detected on public pages`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
