'use client';

import { useState } from "react";
import { 
  LifeBuoy, Search, Filter, MessageCircle, Clock, CheckCircle2, 
  AlertTriangle, ArrowRight, UserPlus, RefreshCw, Send 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Ticket {
  id: string;
  subject: string;
  vendor: string;
  category: "INVENTORY" | "SHIPPING" | "SYSTEM" | "BILLING";
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  createdAt: string;
  slaLimit: string;
  messages: Array<{ sender: string; text: string; time: string }>;
}

export default function SupportTicketsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState("");

  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: "TKT-5021",
      subject: "API label generation timing out",
      vendor: "TechMart Electronics",
      category: "SYSTEM",
      priority: "CRITICAL",
      status: "OPEN",
      createdAt: "10m ago",
      slaLimit: "15m left",
      messages: [
        { sender: "Vendor (TechMart)", text: "We are trying to print shipping labels for Batch #209 but keep getting a gateway time out code (HTTP 504). Please help immediately, the truck is waiting.", time: "10m ago" }
      ]
    },
    {
      id: "TKT-5020",
      subject: "Discrepancy in monthly storage fee",
      vendor: "Apex Retail",
      category: "BILLING",
      priority: "HIGH",
      status: "IN_PROGRESS",
      createdAt: "1h ago",
      slaLimit: "2h left",
      messages: [
        { sender: "Vendor (Apex)", text: "Invoice INV-2026-002 shows 1,24,000 INR for storage charges, but our records indicate we did not exceed 90,000 INR. Please share the bin utilization logs.", time: "1h ago" },
        { sender: "Agent (FCOS Admin)", text: "Hello Apex team. We are checking the bin sensor telemetry logs for Zone B. Will update shortly.", time: "45m ago" }
      ]
    },
    {
      id: "TKT-5019",
      subject: "Unable to update stock levels on SKU-FASH-09",
      vendor: "FashionHub Ltd",
      category: "INVENTORY",
      priority: "MEDIUM",
      status: "OPEN",
      createdAt: "3h ago",
      slaLimit: "5h left",
      messages: [
        { sender: "Vendor (FashionHub)", text: "Getting database lock when pushing stock adjustment via API. Can you verify lock tables?", time: "3h ago" }
      ]
    },
    {
      id: "TKT-5018",
      subject: "BlueDart manifest not pulling weight metrics",
      vendor: "Glow Beauty Shop",
      category: "SHIPPING",
      priority: "LOW",
      status: "RESOLVED",
      createdAt: "1d ago",
      slaLimit: "SLA Compliant",
      messages: [
        { sender: "Vendor (Glow)", text: "Our dispatcher reports weights are set to 0.0 on BlueDart print manifests.", time: "1d ago" },
        { sender: "Agent (FCOS Admin)", text: "This has been resolved by updating the default fallback weight unit to grams for cosmetics. Manifests should print correctly now.", time: "20h ago" }
      ]
    }
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !selectedTicketId) return;

    setTickets(prev => prev.map(t => {
      if (t.id === selectedTicketId) {
        return {
          ...t,
          status: "IN_PROGRESS",
          messages: [
            ...t.messages,
            { sender: "Agent (FCOS Admin)", text: replyInput, time: "Just now" }
          ]
        };
      }
      return t;
    }));
    
    setReplyInput("");
    toast.success("Response sent to vendor");
  };

  const handleResolveTicket = (id: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === id) {
        toast.success(`Ticket ${t.id} marked as RESOLVED`);
        return { ...t, status: "RESOLVED", slaLimit: "SLA Compliant" };
      }
      return t;
    }));
    if (selectedTicketId === id) {
      setSelectedTicketId(null);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Helpdesk board synchronized");
    }, 600);
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.vendor.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case "CRITICAL":
        return <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 text-[9px] animate-pulse">CRITICAL</Badge>;
      case "HIGH":
        return <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 text-[9px]">HIGH</Badge>;
      case "MEDIUM":
        return <Badge className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 text-[9px]">MEDIUM</Badge>;
      case "LOW":
        return <Badge className="bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2 text-[9px]">LOW</Badge>;
      default:
        return <Badge variant="secondary">{prio}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return <Badge className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 text-[9px]">OPEN</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 text-[9px]">IN WORK</Badge>;
      case "RESOLVED":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 text-[9px]">RESOLVED</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <LifeBuoy className="w-8 h-8 text-sky-500" />
            Support & Escalations Center
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Resolve vendor query tickets, track SLA countdown limits, and monitor warehouse routing issues.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-9 gap-2 rounded-xl">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh Board
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Ticket List (ColSpan 2) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input 
                placeholder="Search by ticket ID, subject, vendor..." 
                className="pl-9 bg-transparent border-none text-white focus-visible:ring-0 placeholder:text-slate-500 text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4 w-full sm:w-auto">
              {["all", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map(prio => (
                <Button
                  key={prio}
                  variant={priorityFilter === prio ? "secondary" : "ghost"}
                  onClick={() => setPriorityFilter(prio)}
                  size="sm"
                  className="rounded-lg text-[10px] capitalize h-7 px-2"
                >
                  {prio.toLowerCase()}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredTickets.map(ticket => (
              <div 
                key={ticket.id} 
                onClick={() => setSelectedTicketId(ticket.id)}
                className={`p-4 bg-slate-900/40 hover:bg-slate-900/60 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  selectedTicketId === ticket.id ? "border-sky-500/50 bg-sky-950/5" : "border-slate-800"
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-500 font-bold">{ticket.id}</span>
                    <Badge variant="outline" className="text-[9px] bg-slate-950 border-slate-850 px-2 py-0 text-slate-400">
                      {ticket.category}
                    </Badge>
                    {getPriorityBadge(ticket.priority)}
                    {getStatusBadge(ticket.status)}
                  </div>
                  <h4 className="font-bold text-white text-sm truncate">{ticket.subject}</h4>
                  <p className="text-xs text-slate-400 font-medium">Vendor: {ticket.vendor}</p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-850">
                  <div className="text-left sm:text-right space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold uppercase">
                      <Clock className="w-3 h-3 text-slate-450" />
                      <span>SLA Timer</span>
                    </div>
                    <span className={`text-[10px] font-bold font-mono ${
                      ticket.slaLimit.includes("left") ? "text-rose-400" : "text-emerald-400"
                    }`}>{ticket.slaLimit}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 hidden sm:block" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reply/Details Panel */}
        <div>
          {selectedTicket ? (
            <Card className="border border-slate-800 bg-slate-900/50 backdrop-blur shadow-xl flex flex-col h-[500px]">
              <CardHeader className="pb-3 border-b border-slate-850 shrink-0">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm font-black text-white">{selectedTicket.id}</CardTitle>
                    <CardDescription className="text-xs text-slate-400 truncate max-w-[200px] mt-1 font-semibold">
                      {selectedTicket.subject}
                    </CardDescription>
                  </div>
                  {selectedTicket.status !== "RESOLVED" && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-emerald-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg text-xs"
                      onClick={() => handleResolveTicket(selectedTicket.id)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Resolve
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/40">
                {selectedTicket.messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-xl max-w-[85%] text-xs space-y-1 ${
                      msg.sender.includes("Admin") 
                        ? "bg-sky-650/10 text-slate-100 border border-sky-500/20 ml-auto" 
                        : "bg-slate-900 text-slate-300 border border-slate-800"
                    }`}
                  >
                    <div className="flex justify-between items-center gap-3 text-[9px] font-bold text-slate-500 uppercase">
                      <span>{msg.sender}</span>
                      <span>{msg.time}</span>
                    </div>
                    <p className="font-medium leading-relaxed select-text">{msg.text}</p>
                  </div>
                ))}
              </div>

              {/* Chat Send Form */}
              <CardContent className="p-3 border-t border-slate-850 shrink-0 bg-slate-900/50">
                {selectedTicket.status === "RESOLVED" ? (
                  <div className="p-2 text-center text-xs text-slate-500 font-bold bg-slate-950 rounded-lg border border-slate-900">
                    This ticket has been resolved.
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input 
                      placeholder="Type response to vendor..." 
                      className="bg-slate-950 border-slate-850 text-white rounded-lg text-xs placeholder:text-slate-600 focus-visible:ring-sky-500/45"
                      value={replyInput}
                      onChange={(e) => setReplyInput(e.target.value)}
                    />
                    <Button type="submit" size="icon" className="bg-sky-600 hover:bg-sky-750 text-white rounded-lg shrink-0 w-8 h-8">
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl h-64 flex flex-col items-center justify-center p-6 text-center text-slate-500">
              <MessageCircle className="w-8 h-8 mb-3 opacity-20 text-slate-450" />
              <p className="font-bold text-sm">No ticket selected</p>
              <p className="text-xs text-slate-600 mt-1 max-w-[200px]">Select a ticket from the board to view conversation logs and update SLA statuses.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
