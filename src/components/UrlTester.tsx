import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, AlertTriangle } from "lucide-react";

interface ScrapeResult {
  content: string | { result?: string; content?: string };
  previewUrl?: string;
  url: string;
}

interface Threat {
  type: string;
  original: string;
  location: string;
}

interface SanitizeResult {
  sanitized_content: string;
  threats_detected: Threat[];
  risk_level: string;
  latency_ms: number;
}

interface LogEntry {
  time: string;
  tag: string;
  message: string;
}

interface UrlTesterProps {
  isActive: boolean;
  onResult: (data: {
    raw: string;
    sanitized: string;
    threats: Threat[];
    riskLevel: string;
    latencyMs: number;
    url: string;
  }) => void;
  onStatsUpdate: (stats: { threatsNeutralized: number; extractions: number; avgLatency: string }) => void;
  onScanStateChange: (state: { isScanning: boolean; currentUrl: string | null; scanComplete: boolean }) => void;
  onLogEvent?: (log: LogEntry) => void;
}

const API_BASE = "";

const UrlTester = ({ isActive, onResult, onStatsUpdate, onScanStateChange, onLogEvent }: UrlTesterProps) => {
  const log = (tag: string, message: string) => {
    if (onLogEvent) {
      onLogEvent({
        time: new Date().toLocaleTimeString("en-US"),
        tag,
        message,
      });
    }
  };
  const [url, setUrl] = useState("https://opensafe-ai.vercel.app/poison-js.html");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    if (!url || !isActive) return;

    setIsLoading(true);
    setError(null);
    onScanStateChange({ isScanning: true, currentUrl: url, scanComplete: false });

    log("INBOUND", `Intercepted web request: ${url}`);

    try {
      // Step 1: Scrape the URL with TinyFish
      log("ROUTING", "⚡ Routing to TinyFish isolated browser...");

      const scrapeRes = await fetch(`${API_BASE}/api/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!scrapeRes.ok) {
        const errData = await scrapeRes.json();
        throw new Error(errData.error || "Scrape failed");
      }

      const scrapeData: ScrapeResult = await scrapeRes.json();
      log("ROUTING", "✓ TinyFish extraction complete - JS rendered, DOM captured");

      // Extract content from response
      let rawContent = "";
      if (typeof scrapeData.content === "string") {
        rawContent = scrapeData.content;
      } else if (scrapeData.content?.result) {
        rawContent = scrapeData.content.result;
      } else if (scrapeData.content?.content) {
        rawContent = scrapeData.content.content;
      }

      if (!rawContent) {
        throw new Error("No content extracted from URL");
      }

      // Step 2: Sanitize the content
      log("SECURITY", "🔍 Sending to OpenAI for threat analysis...");

      const sanitizeRes = await fetch(`${API_BASE}/api/sanitize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: rawContent, url }),
      });

      if (!sanitizeRes.ok) {
        const errData = await sanitizeRes.json();
        throw new Error(errData.error || "Sanitize failed");
      }

      const sanitizeData: SanitizeResult = await sanitizeRes.json();

      if (sanitizeData.threats_detected.length > 0) {
        log("SECURITY", `🛡️ ALERT: ${sanitizeData.threats_detected.length} threat(s) detected! Risk: ${sanitizeData.risk_level.toUpperCase()}`);
        sanitizeData.threats_detected.forEach((threat) => {
          log("SECURITY", `   ↳ ${threat.type}: "${threat.original.slice(0, 50)}..."`);
        });
      } else {
        log("SECURITY", "✓ No threats detected - content is clean");
      }

      // Send results to parent
      onResult({
        raw: rawContent,
        sanitized: sanitizeData.sanitized_content,
        threats: sanitizeData.threats_detected,
        riskLevel: sanitizeData.risk_level,
        latencyMs: sanitizeData.latency_ms,
        url,
      });

      // Update stats
      onStatsUpdate({
        threatsNeutralized: sanitizeData.threats_detected.length,
        extractions: 1,
        avgLatency: (sanitizeData.latency_ms / 1000).toFixed(1) + "s",
      });

      // Mark scan complete
      log("OUTBOUND", "✓ Sanitized content ready for AI agent");
      onScanStateChange({ isScanning: false, currentUrl: url, scanComplete: true });

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      log("SECURITY", `❌ Error: ${errorMsg}`);
      setError(errorMsg);
      onScanStateChange({ isScanning: false, currentUrl: url, scanComplete: false });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-4">
        Test URL Scanner
      </h2>

      <div className="flex gap-3">
        <Input
          type="url"
          placeholder="Enter URL to scan..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={!isActive || isLoading}
          className="flex-1"
        />
        <Button
          onClick={handleTest}
          disabled={!isActive || isLoading || !url}
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Scan
            </>
          )}
        </Button>
      </div>

      {!isActive && (
        <p className="text-xs text-muted-foreground mt-3">
          Enable SafeBrowse to test URL scanning
        </p>
      )}

      {error && (
        <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
};

export default UrlTester;
