import { useEffect, useRef, useState } from "react";

const tagColors: Record<string, string> = {
  INBOUND: "text-muted-foreground",
  ROUTING: "text-primary",
  SECURITY: "text-destructive",
  OUTBOUND: "text-success",
};

interface LogEntry {
  time: string;
  tag: string;
  message: string;
}

interface LogEntry {
  time: string;
  tag: string;
  message: string;
}

interface LiveLogsProps {
  onStatsUpdate?: (stats: {
    threatsNeutralized: number;
    extractions: number;
    avgLatency: string;
  }) => void;
  externalLogs?: LogEntry[];
}

const API_BASE = import.meta.env.DEV ? "" : "";

const LiveLogs = ({ onStatsUpdate, externalLogs = [] }: LiveLogsProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      time: new Date().toLocaleTimeString("en-US"),
      tag: "INBOUND",
      message: "SafeBrowse initialized. Waiting for agent traffic...",
    },
  ]);
  const [isConnected, setIsConnected] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Add external logs when they come in
  useEffect(() => {
    if (externalLogs.length > 0) {
      setLogs((prev) => {
        const existingKeys = new Set(prev.map((l) => l.time + l.message));
        const newLogs = externalLogs.filter(
          (e) => !existingKeys.has(e.time + e.message)
        );
        if (newLogs.length > 0) {
          return [...prev, ...newLogs].slice(-50);
        }
        return prev;
      });
    }
  }, [externalLogs]);

  // Auto-scroll to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="rounded-xl border border-border bg-terminal overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            isConnected ? "bg-success animate-pulse" : "bg-destructive"
          }`}
        />
        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
        <span className="h-2.5 w-2.5 rounded-full bg-success" />
        <span className="ml-3 text-xs font-medium text-muted-foreground uppercase tracking-widest">
          Live Agent Traffic
        </span>
        {isConnected && (
          <span className="ml-auto text-xs text-success">Connected</span>
        )}
      </div>

      <div className="p-5 space-y-2 font-mono-terminal text-[13px] leading-relaxed max-h-[300px] overflow-y-auto">
        {logs.map((log, i) => (
          <p key={i}>
            <span className="text-muted-foreground">[{log.time}]</span>{" "}
            <span className={tagColors[log.tag] ?? "text-foreground"}>
              [{log.tag}]
            </span>{" "}
            <span className="text-foreground/80">{log.message}</span>
          </p>
        ))}
        <p className="text-muted-foreground animate-pulse">▌</p>
        <div ref={logsEndRef} />
      </div>
    </div>
  );
};

export default LiveLogs;
