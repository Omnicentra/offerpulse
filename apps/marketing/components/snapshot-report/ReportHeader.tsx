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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied",
      description: "Report URL copied to clipboard",
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
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
