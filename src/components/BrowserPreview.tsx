import { Monitor, Shield, Loader2 } from "lucide-react";

interface BrowserPreviewProps {
  previewUrl?: string | null;
  isActive: boolean;
}

const BrowserPreview = ({ previewUrl, isActive }: BrowserPreviewProps) => {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
        <Monitor className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          TinyFish Isolated Browser
        </span>
        {isActive && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-success">
            <Shield className="h-3 w-3" />
            Sandboxed
          </span>
        )}
      </div>

      <div className="aspect-video bg-terminal relative">
        {!isActive ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <Monitor className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">Enable SafeBrowse to activate</p>
            <p className="text-xs mt-1 opacity-70">
              Isolated browser preview will appear here
            </p>
          </div>
        ) : previewUrl ? (
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title="TinyFish Browser Preview"
            sandbox="allow-scripts"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <Shield className="h-12 w-12 mb-3 text-primary opacity-50" />
            <p className="text-sm font-medium">Ready to Intercept</p>
            <p className="text-xs mt-1 opacity-70 text-center px-4">
              When an AI agent makes a web request, <br />the isolated browser session will appear here
            </p>
          </div>
        )}
      </div>

      {isActive && (
        <div className="px-5 py-3 border-t border-border bg-secondary/30">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success" />
              Network Isolated
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Cookie Sandboxed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-info" />
              JS Contained
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowserPreview;
