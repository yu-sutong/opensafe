import { Shield, Globe, Loader2, CheckCircle, AlertTriangle } from "lucide-react";

interface ScanStatusProps {
  isActive: boolean;
  isScanning: boolean;
  currentUrl: string | null;
  scanComplete: boolean;
  threatsFound: number;
}

const ScanStatus = ({
  isActive,
  isScanning,
  currentUrl,
  scanComplete,
  threatsFound,
}: ScanStatusProps) => {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
        <Globe className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          Scan Status
        </span>
        {isScanning && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-primary">
            <Loader2 className="h-3 w-3 animate-spin" />
            Scanning
          </span>
        )}
        {scanComplete && !isScanning && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-success">
            <CheckCircle className="h-3 w-3" />
            Complete
          </span>
        )}
      </div>

      <div className="aspect-video bg-terminal relative flex items-center justify-center">
        {!isActive ? (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Shield className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">Enable SafeBrowse to start scanning</p>
          </div>
        ) : isScanning ? (
          <div className="flex flex-col items-center justify-center text-center px-6">
            <div className="relative">
              <Globe className="h-16 w-16 text-primary opacity-20" />
              <Loader2 className="h-8 w-8 text-primary animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-sm font-medium text-foreground mt-4">Scanning URL...</p>
            <p className="text-xs text-muted-foreground mt-2 font-mono break-all max-w-sm">
              {currentUrl}
            </p>
            <div className="flex items-center gap-6 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                TinyFish Extraction
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-muted" />
                OpenAI Sanitization
              </span>
            </div>
          </div>
        ) : scanComplete ? (
          <div className="flex flex-col items-center justify-center text-center px-6">
            {threatsFound > 0 ? (
              <>
                <div className="h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <p className="text-sm font-medium text-destructive">
                  {threatsFound} Threat{threatsFound !== 1 ? 's' : ''} Detected & Neutralized
                </p>
              </>
            ) : (
              <>
                <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                <p className="text-sm font-medium text-success">Scan Complete - No Threats</p>
              </>
            )}
            <p className="text-xs text-muted-foreground mt-2 font-mono break-all max-w-sm">
              {currentUrl}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Shield className="h-12 w-12 mb-3 text-primary opacity-50" />
            <p className="text-sm font-medium">Ready to Scan</p>
            <p className="text-xs mt-1 opacity-70">Enter a URL above and click Scan</p>
          </div>
        )}
      </div>

      {isActive && (
        <div className="px-5 py-3 border-t border-border bg-secondary/30">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-success' : 'bg-muted'}`} />
              Isolated Browser
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-success' : 'bg-muted'}`} />
              Content Sanitizer
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-success' : 'bg-muted'}`} />
              Threat Detection
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanStatus;
