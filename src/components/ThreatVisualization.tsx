import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileText, Shield, Eye } from "lucide-react";

interface Threat {
  type: string;
  original: string;
  location: string;
}

interface ThreatVisualizationProps {
  rawContent?: string;
  sanitizedContent?: string;
  threats?: Threat[];
}

const threatTypeColors: Record<string, string> = {
  hidden_text: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  prompt_override: "bg-red-500/20 text-red-400 border-red-500/30",
  jailbreak: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  social_engineering: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  encoded_payload: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const ThreatVisualization = ({
  rawContent,
  sanitizedContent,
  threats = [],
}: ThreatVisualizationProps) => {
  const [activeTab, setActiveTab] = useState("threats");

  // Only show real data - no demo placeholders
  const displayRaw = rawContent || "";
  const displaySanitized = sanitizedContent || "";
  const displayThreats = threats || [];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
        <Eye className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          Content Analysis
        </span>
        {displayThreats.length > 0 ? (
          <Badge variant="destructive" className="ml-auto">
            {displayThreats.length} Threat{displayThreats.length !== 1 ? "s" : ""} Found
          </Badge>
        ) : (
          <Badge variant="outline" className="ml-auto text-success">
            Clean
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-5 pt-3">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="raw" className="gap-2">
              <FileText className="h-3.5 w-3.5" />
              Raw Content
            </TabsTrigger>
            <TabsTrigger value="threats" className="gap-2">
              <AlertTriangle className="h-3.5 w-3.5" />
              Threats ({displayThreats.length})
            </TabsTrigger>
            <TabsTrigger value="sanitized" className="gap-2">
              <Shield className="h-3.5 w-3.5" />
              Sanitized
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="raw" className="p-5 pt-3">
          <div className="rounded-lg bg-terminal p-4 font-mono text-xs max-h-[300px] overflow-auto">
            <pre className="text-foreground/70 whitespace-pre-wrap">{displayRaw}</pre>
          </div>
          <p className="text-xs text-destructive mt-3 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Contains hidden malicious content that would be invisible to the AI agent
          </p>
        </TabsContent>

        <TabsContent value="threats" className="p-5 pt-3">
          {displayThreats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No threats detected</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayThreats.map((threat, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-destructive/30 bg-destructive/5 p-4"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className={threatTypeColors[threat.type] || ""}
                        >
                          {threat.type.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {threat.location}
                        </span>
                      </div>
                      <pre className="text-xs text-destructive/90 bg-destructive/10 rounded p-2 overflow-auto whitespace-pre-wrap font-mono">
                        {threat.original}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sanitized" className="p-5 pt-3">
          <div className="rounded-lg bg-terminal p-4 font-mono text-xs max-h-[300px] overflow-auto">
            <pre className="text-success/90 whitespace-pre-wrap">{displaySanitized}</pre>
          </div>
          <p className="text-xs text-success mt-3 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Safe content delivered to AI agent - all injection attempts removed
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ThreatVisualization;
