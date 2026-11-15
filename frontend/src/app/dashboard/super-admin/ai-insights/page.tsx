'use client';

import { useState } from "react";
import { 
  Sparkles, TrendingUp, AlertTriangle, ArrowRight, CheckCircle2, 
  Map, Lightbulb, RefreshCw, Zap, Gauge, BarChart2 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Recommendation {
  id: string;
  title: string;
  source: string;
  impact: string;
  confidence: number;
  description: string;
  status: "PENDING" | "APPLYING" | "RESOLVED";
  type: "INVENTORY" | "ROUTING" | "STAFF" | "SHIPPING";
}

export default function AIInsightsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    {
      id: "AI-301",
      title: "Stock balancing between Delhi & Mumbai",
      source: "Inventory Intelligence",
      impact: "Reduce courier charges by 18%",
      confidence: 94,
      description: "Delhi warehouse has 450 units of TechMart SKU-TM-01 (overstock), while Mumbai is down to 12 units (understock). Moving 180 units will satisfy Mumbai demand and reduce trans-shipment courier routing fees.",
      status: "PENDING",
      type: "INVENTORY"
    },
    {
      id: "AI-302",
      title: "Set Delhivery as primary for Zone North",
      source: "Carrier Performance Engine",
      impact: "Improve delivery success by 4.2%",
      confidence: 88,
      description: "Over the last 14 days, Delhivery delivery success rate in Zone North (Delhi NCR/Punjab) reached 97.4%, outperforming BlueDart by 5.1%. Shift routing rules in automation settings.",
      status: "PENDING",
      type: "ROUTING"
    },
    {
      id: "AI-303",
      title: "Demand Spike Forecast: fashion Category",
      source: "Predictive Analytics Models",
      impact: "Prevent out-of-stock SLA breach",
      confidence: 91,
      description: "Seasonal promotional tracking signals a 40% increase in order volume for FashionHub apparel within next 72 hours. Recommend increasing reserved inventory counts.",
      status: "PENDING",
      type: "INVENTORY"
    },
    {
      id: "AI-304",
      title: "Schedule additional picker shifts for Warehouse B",
      source: "Workforce Optimization Engine",
      impact: "Increase picker throughput by 12%",
      confidence: 82,
      description: "Average pick time at Warehouse B has degraded to 42s per item due to congestion in Aisle 3. Scheduling 2 additional picking handlers for the evening shift will resolve the bottleneck.",
      status: "RESOLVED",
      type: "STAFF"
    }
  ]);

  const handleApplyFix = (id: string) => {
    setRecommendations(prev => prev.map(rec => {
      if (rec.id === id) {
        toast.info(`AI Recommendation ${rec.id}: Applying fixes to rules...`);
        return { ...rec, status: "APPLYING" };
      }
      return rec;
    }));

    setTimeout(() => {
      setRecommendations(prev => prev.map(rec => {
        if (rec.id === id) {
          toast.success(`AI Recommendation ${rec.id} applied successfully!`);
          return { ...rec, status: "RESOLVED" };
        }
        return rec;
      }));
    }, 1500);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("AI models re-evaluated and refreshed");
    }, 800);
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 90) return "text-emerald-400";
    if (conf >= 80) return "text-indigo-400";
    return "text-amber-400";
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case "INVENTORY":
        return <TrendingUp className="w-5 h-5 text-indigo-500" />;
      case "ROUTING":
        return <Map className="w-5 h-5 text-sky-500" />;
      case "STAFF":
        return <Zap className="w-5 h-5 text-amber-500" />;
      default:
        return <Lightbulb className="w-5 h-5 text-violet-500" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
            AI Operations Intelligence & Insights
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Autonomous recommendations powered by logistics machine learning models to prevent bottlenecks.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-9 gap-2 rounded-xl">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Run Re-evaluation
          </Button>
        </div>
      </div>

      {/* KPI stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border border-slate-800 bg-slate-900/50 backdrop-blur shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Revenue Impact Potential</p>
              <h2 className="text-2xl font-black text-white mt-1 tracking-tighter">₹4,20,500</h2>
              <span className="text-[10px] text-emerald-400 font-semibold">Monthly saving estimate</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-800 bg-slate-900/50 backdrop-blur shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl" />
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
              <Gauge className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fulfillment Efficiency Rating</p>
              <h2 className="text-2xl font-black text-white mt-1 tracking-tighter">94.8%</h2>
              <span className="text-[10px] text-sky-400 font-semibold">System-wide score</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-800 bg-slate-900/50 backdrop-blur shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl" />
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Recommendations</p>
              <h2 className="text-2xl font-black text-white mt-1 tracking-tighter">
                {recommendations.filter(r => r.status === "PENDING").length} Available
              </h2>
              <span className="text-[10px] text-slate-500 font-semibold">Evaluated in real-time</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations Cards Section */}
      <div className="grid gap-6">
        {recommendations.map(rec => (
          <Card key={rec.id} className={`border backdrop-blur shadow-xl transition-all relative overflow-hidden ${
            rec.status === "RESOLVED" 
              ? "border-slate-800/80 bg-slate-900/10" 
              : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
          }`}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl" />
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-950 border border-slate-850 rounded-xl">
                    {getRecommendationIcon(rec.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-550 font-bold">{rec.id}</span>
                      <Badge variant="outline" className="text-[9px] bg-slate-950 border-slate-850 py-0 text-slate-450">
                        {rec.source}
                      </Badge>
                      {rec.status === "RESOLVED" && (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] py-0">
                          RESOLVED
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-extrabold text-white text-base mt-1">{rec.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:self-center">
                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Confidence</p>
                    <span className={`text-xs font-black font-mono ${getConfidenceColor(rec.confidence)}`}>
                      {rec.confidence}%
                    </span>
                  </div>
                  <div className="w-px h-8 bg-slate-800 hidden sm:block" />
                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Est. Impact</p>
                    <span className="text-xs font-bold text-white">
                      {rec.impact}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-350 leading-relaxed font-medium">
                {rec.description}
              </p>

              {rec.status !== "RESOLVED" && (
                <div className="flex items-center gap-3 pt-3 border-t border-slate-850 justify-between sm:justify-start">
                  <Button 
                    className="text-xs font-bold rounded-xl h-8 bg-indigo-600 hover:bg-indigo-750 text-white gap-1.5 shadow-lg shadow-indigo-600/10"
                    onClick={() => handleApplyFix(rec.id)}
                    disabled={rec.status === "APPLYING"}
                  >
                    {rec.status === "APPLYING" ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Adjusting settings...
                      </>
                    ) : (
                      <>
                        Apply Recommendation <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs rounded-xl h-8 text-slate-550 hover:bg-slate-800" onClick={() => toast.info("Recommendation dismissed")}>
                    Dismiss
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
