import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface ControlPanelProps {
  active: boolean;
  onToggle: (v: boolean) => void;
}

const API_BASE = import.meta.env.DEV ? "" : "";

const ControlPanel = ({ active, onToggle }: ControlPanelProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  // Fetch initial state on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/state`)
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.enabled === "boolean") {
          onToggle(data.enabled);
          setIsSynced(true);
        }
      })
      .catch(() => {
        // API not available, use local state
        setIsSynced(true);
      });
  }, []);

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: checked }),
      });
      const data = await res.json();
      onToggle(data.enabled);
    } catch {
      // Fallback to local state
      onToggle(checked);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
      <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-6">
        Air-Gap Execution Environment
      </h2>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
        <div className="relative">
          <Switch
            checked={active}
            onCheckedChange={handleToggle}
            disabled={isLoading}
            className="scale-150 origin-left data-[state=checked]:bg-primary"
          />
          {isLoading && (
            <Loader2 className="absolute -right-8 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="flex flex-col gap-1">
          <p
            className={`text-sm font-medium transition-colors ${
              active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {active
              ? "SafeBrowse Active: TinyFish & OpenAI Routing Enabled"
              : "Standard Mode (Vulnerable)"}
          </p>
          {active && (
            <p className="text-xs text-muted-foreground">
              All web requests are routed through isolated cloud browser
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
