import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { FileCode, Eye, ShieldAlert, ShieldCheck } from "lucide-react";

interface ComparisonViewProps {
  url: string | null;
  tinyfishContent: string | null;
  isActive: boolean;
}

const ComparisonView = ({ url, tinyfishContent, isActive }: ComparisonViewProps) => {
  const [rawHtml, setRawHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch raw HTML when URL changes
  useEffect(() => {
    if (!url || !isActive) {
      setRawHtml(null);
      return;
    }

    const fetchRawHtml = async () => {
      setIsLoading(true);
      try {
        // Use a proxy to avoid CORS issues, or fetch directly if same origin
        const response = await fetch(url);
        const html = await response.text();
        setRawHtml(html);
      } catch (error) {
        setRawHtml("Failed to fetch raw HTML");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRawHtml();
  }, [url, isActive]);

  // Check for attack patterns
  const attackPatterns = [
    "IGNORE ALL",
    "SYSTEM OVERRIDE",
    "ADMIN DEBUG",
    "JAILBREAK",
    "DAN ",
    "unrestricted",
    "safety restrictions",
    "bypass",
    "PRIORITY INSTRUCTION",
    "CRITICAL SYSTEM MESSAGE",
  ];

  // Strip script tags to check only visible HTML content
  const stripScriptTags = (html: string): string => {
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  };

  const containsAttacks = (text: string | null, stripScripts = false): boolean => {
    if (!text) return false;
    const checkText = stripScripts ? stripScriptTags(text) : text;
    return attackPatterns.some((pattern) =>
      checkText.toUpperCase().includes(pattern.toUpperCase())
    );
  };

  // Raw HTML: only check content outside script tags
  const rawHasAttacks = containsAttacks(rawHtml, true);
  // TinyFish: check all content (this is what AI agents see)
  const tinyfishHasAttacks = containsAttacks(tinyfishContent, false);

  if (!isActive) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
        <Eye className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          Raw HTML vs Rendered DOM
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          Why TinyFish matters
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* Raw HTML Side */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Raw HTML Fetch</span>
            </div>
            {rawHtml && (
              <Badge
                variant={rawHasAttacks ? "destructive" : "outline"}
                className={!rawHasAttacks ? "text-success border-success" : ""}
              >
                {rawHasAttacks ? (
                  <>
                    <ShieldAlert className="h-3 w-3 mr-1" />
                    Attacks Found
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Looks Safe
                  </>
                )}
              </Badge>
            )}
          </div>

          <div className="rounded-lg bg-terminal p-4 font-mono text-xs max-h-[200px] overflow-auto">
            {isLoading ? (
              <p className="text-muted-foreground">Fetching raw HTML...</p>
            ) : rawHtml ? (
              <pre className="text-foreground/70 whitespace-pre-wrap">
                {rawHtml.slice(0, 1500)}
                {rawHtml.length > 1500 && "\n\n... (truncated)"}
              </pre>
            ) : (
              <p className="text-muted-foreground">No URL scanned yet</p>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            Simple <code>fetch()</code> or <code>curl</code> - only sees static HTML
          </p>
        </div>

        {/* TinyFish Rendered Side */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">TinyFish Rendered DOM</span>
            </div>
            {tinyfishContent && (
              <Badge
                variant={tinyfishHasAttacks ? "destructive" : "outline"}
                className={!tinyfishHasAttacks ? "text-success border-success" : ""}
              >
                {tinyfishHasAttacks ? (
                  <>
                    <ShieldAlert className="h-3 w-3 mr-1" />
                    Attacks Found!
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Clean
                  </>
                )}
              </Badge>
            )}
          </div>

          <div className="rounded-lg bg-terminal p-4 font-mono text-xs max-h-[200px] overflow-auto">
            {tinyfishContent ? (
              <pre className="text-foreground/70 whitespace-pre-wrap">
                {tinyfishContent.slice(0, 1500)}
                {tinyfishContent.length > 1500 && "\n\n... (truncated)"}
              </pre>
            ) : (
              <p className="text-muted-foreground">No URL scanned yet</p>
            )}
          </div>

          <p className="text-xs text-destructive mt-3 font-medium">
            Renders JavaScript - sees what AI agents see!
          </p>
        </div>
      </div>

      {rawHtml && tinyfishContent && !rawHasAttacks && tinyfishHasAttacks && (
        <div className="px-5 py-4 bg-destructive/10 border-t border-destructive/30">
          <p className="text-sm text-destructive flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            <strong>JS-Injected Attack Detected!</strong> Raw HTML looks safe, but TinyFish reveals hidden threats that AI agents would see.
          </p>
        </div>
      )}
    </div>
  );
};

export default ComparisonView;
