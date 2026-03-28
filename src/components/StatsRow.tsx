import { ShieldAlert, Zap, Clock } from "lucide-react";

interface StatsRowProps {
  threatsNeutralized?: number;
  extractions?: number;
  avgLatency?: string;
}

const StatsRow = ({
  threatsNeutralized = 0,
  extractions = 0,
  avgLatency = "0.0s",
}: StatsRowProps) => {
  const stats = [
    {
      label: "Threats Neutralized",
      value: String(threatsNeutralized),
      icon: ShieldAlert,
      iconColor: "text-destructive",
      highlight: threatsNeutralized > 0,
    },
    {
      label: "TinyFish Extractions",
      value: String(extractions),
      icon: Zap,
      iconColor: "text-primary",
      highlight: extractions > 0,
    },
    {
      label: "Avg Decontamination Latency",
      value: avgLatency,
      icon: Clock,
      iconColor: "text-info",
      highlight: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`flex items-center gap-4 rounded-xl border bg-card p-5 transition-colors ${
            s.highlight ? "border-destructive/50" : "border-border"
          }`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              s.highlight ? "bg-destructive/10" : "bg-secondary"
            }`}
          >
            <s.icon className={`h-5 w-5 ${s.iconColor}`} />
          </div>
          <div>
            <p
              className={`text-2xl font-semibold ${
                s.highlight ? "text-destructive" : "text-foreground"
              }`}
            >
              {s.value}
            </p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsRow;
