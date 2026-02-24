import { Button } from "@/components/ui/button";
import { RefreshCw, Share2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReportHeaderProps {
  domain: string;
  timestamp: string;
  url: string;
  onRescan: () => void;
}

export function ReportHeader({ domain, timestamp, url, onRescan }: ReportHeaderProps) {
  const { toast } = useToast();
  
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

  const handleShare = () => {
    // Create shareable URL with the scanned URL as a parameter
    const shareUrl = `${window.location.origin}/free-tools/offer-snapshot/tool?url=${encodeURIComponent(url)}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied",
      description: "Shareable report URL copied to clipboard",
    });
  };

  const handleDownload = () => {
    toast({
      title: "Coming soon",
      description: "PDF download will be available soon",
    });
  };

  return (
    <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left: Site info */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white">
              <img
                src={faviconUrl}
                alt={`${domain} favicon`}
                className="h-6 w-6"
                onError={(e) => {
                  // Fallback to generic icon if favicon fails to load
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2'%3E%3Cpath d='M13 10V3L4 14h7v7l9-11h-7z'/%3E%3C/svg%3E";
                }}
              />
            </div>
            <div>
              <div className="font-semibold text-slate-900">{domain}</div>
              <div className="text-xs text-slate-500">Scanned {timestamp}</div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRescan} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Re-scan
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2" disabled>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
