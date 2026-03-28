import { useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import StatsRow from "@/components/StatsRow";
import ControlPanel from "@/components/ControlPanel";
import LiveLogs from "@/components/LiveLogs";
import UrlTester from "@/components/UrlTester";
import ScanStatus from "@/components/ScanStatus";
import ComparisonView from "@/components/ComparisonView";

// Lazy load heavier components
import { lazy, Suspense } from "react";
const ThreatVisualization = lazy(() => import("@/components/ThreatVisualization"));

interface Stats {
  threatsNeutralized: number;
  extractions: number;
  avgLatency: string;
}

interface ThreatData {
  raw: string;
  sanitized: string;
  threats: Array<{ type: string; original: string; location: string }>;
  riskLevel: string;
  url: string;
}

interface ScanState {
  isScanning: boolean;
  currentUrl: string | null;
  scanComplete: boolean;
}

interface LogEntry {
  time: string;
  tag: string;
  message: string;
}

const Index = () => {
  const [safeBrowseActive, setSafeBrowseActive] = useState(false);
  const [stats, setStats] = useState<Stats>({
    threatsNeutralized: 0,
    extractions: 0,
    avgLatency: "0.0s",
  });
  const [threatData, setThreatData] = useState<ThreatData | null>(null);
  const [scanState, setScanState] = useState<ScanState>({
    isScanning: false,
    currentUrl: null,
    scanComplete: false,
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const handleStatsUpdate = useCallback((newStats: Stats) => {
    setStats((prev) => ({
      threatsNeutralized: prev.threatsNeutralized + newStats.threatsNeutralized,
      extractions: prev.extractions + newStats.extractions,
      avgLatency: newStats.avgLatency,
    }));
  }, []);

  const handleScanResult = useCallback((data: ThreatData) => {
    setThreatData(data);
  }, []);

  const handleScanStateChange = useCallback((state: ScanState) => {
    setScanState(state);
  }, []);

  const handleLogEvent = useCallback((log: LogEntry) => {
    setLogs((prev) => [...prev, log]);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
        <StatsRow
          threatsNeutralized={stats.threatsNeutralized}
          extractions={stats.extractions}
          avgLatency={stats.avgLatency}
        />
        <ControlPanel
          active={safeBrowseActive}
          onToggle={setSafeBrowseActive}
        />

        <UrlTester
          isActive={safeBrowseActive}
          onResult={handleScanResult}
          onStatsUpdate={handleStatsUpdate}
          onScanStateChange={handleScanStateChange}
          onLogEvent={handleLogEvent}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LiveLogs externalLogs={logs} />
          <ScanStatus
            isActive={safeBrowseActive}
            isScanning={scanState.isScanning}
            currentUrl={scanState.currentUrl}
            scanComplete={scanState.scanComplete}
            threatsFound={threatData?.threats?.length || 0}
          />
        </div>

        {safeBrowseActive && (
          <ComparisonView
            url={scanState.currentUrl}
            tinyfishContent={threatData?.raw || null}
            isActive={safeBrowseActive && scanState.scanComplete}
          />
        )}

        {safeBrowseActive && threatData && (
          <Suspense fallback={<div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">Loading analysis...</div>}>
            <ThreatVisualization
              rawContent={threatData.raw}
              sanitizedContent={threatData.sanitized}
              threats={threatData.threats}
            />
          </Suspense>
        )}
      </main>
    </div>
  );
};

export default Index;
