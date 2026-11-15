'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  LifeBuoy, 
  Plus, 
  Send, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare,
  Paperclip,
  Search,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  sender: 'brand' | 'fcos_staff';
  senderName: string;
  text: string;
  timestamp: string;
}

interface SupportTicket {
  id: string;
  title: string;
  category: 'fulfillment' | 'billing' | 'inventory' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'resolved';
  created: string;
  messages: Message[];
}

const initialTickets: SupportTicket[] = [
  {
    id: 'TKT-001',
    title: 'Dispute: Pick & Pack quantity discrepancy for batch #440',
    category: 'fulfillment',
    priority: 'high',
    status: 'in-progress',
    created: '2026-05-26 10:20',
    messages: [
      { id: 'm1', sender: 'brand', senderName: 'D2C Brand Owner', text: 'Hi, we noticed our inventory invoice billed for 450 pick-and-pack actions, but our Shopify records indicate only 432 items were shipped during that period. Could you check if 18 actions were billed in error?', timestamp: 'May 26, 10:20 AM' },
      { id: 'm2', sender: 'fcos_staff', senderName: 'Operations Lead (NJ-1)', text: 'Hello! I am checking this with our warehouse manager at Secaucus. We had 18 returns re-processed, which might be why the charges were applied. I will verify if those count as billing pick events.', timestamp: 'May 26, 02:40 PM' }
    ]
  },
  {
    id: 'TKT-002',
    title: 'Shopify stock count failed to sync',
    category: 'inventory',
    priority: 'medium',
    status: 'open',
    created: '2026-05-27 08:15',
    messages: [
      { id: 'm3', sender: 'brand', senderName: 'D2C Brand Owner', text: 'Hi support team, SKU "ECO-TEE-BLK-S" was restocked CA-1 (120 units), but Shopify still shows 4 units in stock. We are afraid of stockouts on our webstore. Please force a catalog webhook sync.', timestamp: 'May 27, 08:15 AM' }
    ]
  },
  {
    id: 'TKT-003',
    title: 'Address update for Order #FCOS-9912',
    category: 'fulfillment',
    priority: 'low',
    status: 'resolved',
    created: '2026-05-25 14:00',
    messages: [
      { id: 'm4', sender: 'brand', senderName: 'Brand Operations Manager', text: 'Please change the shipping address for order FCOS-9912 to 120 Broadway Suite 4, New York, NY.', timestamp: 'May 25, 02:00 PM' },
      { id: 'm5', sender: 'fcos_staff', senderName: 'Customer Success Agent', text: 'Address updated successfully! Order has been packed and is ready to ship.', timestamp: 'May 25, 03:30 PM' }
    ]
  }
];

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
  const [selectedTicketId, setSelectedTicketId] = useState<string>('TKT-001');
  const [replyText, setReplyText] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'fulfillment' | 'billing' | 'inventory' | 'other'>('fulfillment');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newDetails, setNewDetails] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || tickets[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'brand',
      senderName: 'D2C Brand Owner',
      text: replyText,
      timestamp: 'Just now'
    };

    setTickets(prev => prev.map(t => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          messages: [...t.messages, newMessage]
        };
      }
      return t;
    }));

    setReplyText('');
    toast.success("Response sent to operations staff");
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDetails) {
      toast.error("Please fill in the ticket title and explanation details.");
      return;
    }

    const newTicket: SupportTicket = {
      id: `TKT-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle,
      category: newCategory,
      priority: newPriority,
      status: 'open',
      created: new Date().toISOString().replace('T', ' ').substring(0, 16),
      messages: [
        {
          id: `msg-init-${Date.now()}`,
          sender: 'brand',
          senderName: 'D2C Brand Owner',
          text: newDetails,
          timestamp: 'Just now'
        }
      ]
    };

    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Opening new support ticket...',
        success: () => {
          setTickets([newTicket, ...tickets]);
          setSelectedTicketId(newTicket.id);
          setIsCreateOpen(false);
          setNewTitle('');
          setNewDetails('');
          return `Ticket ${newTicket.id} created successfully!`;
        },
        error: 'Failed to create ticket.',
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Support Tickets</h2>
          <p className="text-muted-foreground font-medium">Communicate directly with fulfillment center operations and resolve billing or inventory disputes.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Create ticket dialog */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" /> Open New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl bg-slate-900 border-slate-800 text-slate-100 rounded-3xl">
              <form onSubmit={handleCreateTicket}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                    <LifeBuoy className="w-5 h-5 text-primary" />
                    Open Support Dispute
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    File a request for tracking support, billing adjustments, or manual warehouse overrides.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-350">Ticket Summary</span>
                    <Input 
                      placeholder="e.g. Invoice discrepancy for Storage fees" 
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="h-10 border-slate-850 bg-slate-950 text-xs rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-350">Category</span>
                      <Select value={newCategory} onValueChange={(val: any) => setNewCategory(val)}>
                        <SelectTrigger className="border-slate-850 bg-slate-950 text-xs rounded-xl h-10">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-950 border-slate-850 text-slate-100">
                          <SelectItem value="fulfillment">Fulfillment Dispute</SelectItem>
                          <SelectItem value="billing">Billing Inquiry</SelectItem>
                          <SelectItem value="inventory">Inventory Adjustment</SelectItem>
                          <SelectItem value="other">Other Operations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-350">Priority</span>
                      <Select value={newPriority} onValueChange={(val: any) => setNewPriority(val)}>
                        <SelectTrigger className="border-slate-850 bg-slate-950 text-xs rounded-xl h-10">
                          <SelectValue placeholder="Select Priority" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-950 border-slate-850 text-slate-100">
                          <SelectItem value="low">Low (Standard)</SelectItem>
                          <SelectItem value="medium">Medium (Priority)</SelectItem>
                          <SelectItem value="high">High (SLA breach)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-350">Problem Details & Context</span>
                    <Textarea 
                      placeholder="Describe the issue, including SKU codes or order IDs, to expedite resolution." 
                      value={newDetails}
                      onChange={(e) => setNewDetails(e.target.value)}
                      className="border-slate-850 bg-slate-950 text-xs rounded-xl min-h-24"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" className="rounded-xl border-slate-800 text-slate-300 hover:bg-slate-800" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="rounded-xl shadow-lg shadow-primary/20">
                    File Ticket
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Ticket portal Grid */}
      <div className="grid gap-6 lg:grid-cols-7 h-[600px]">
        {/* Left Side: Tickets List */}
        <Card className="lg:col-span-3 border-none shadow-sm flex flex-col overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-800/80">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search ticket logs..." 
                className="pl-9 h-9 text-xs rounded-xl border-slate-200 dark:border-slate-800"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {tickets.map((t) => {
              const isSelected = selectedTicketId === t.id;
              const lastMsg = t.messages[t.messages.length - 1];

              return (
                <div 
                  key={t.id} 
                  className={`p-4 cursor-pointer transition-colors flex flex-col gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 ${isSelected ? 'bg-primary/[0.03] dark:bg-primary/[0.015] border-l-2 border-primary' : ''}`}
                  onClick={() => setSelectedTicketId(t.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-slate-400">{t.id} • {t.category}</span>
                    <Badge className={
                      t.priority === 'high' 
                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 font-bold text-[8px] px-1 py-0'
                        : 'bg-slate-500/10 text-slate-500 border-slate-500/20 font-bold text-[8px] px-1 py-0'
                    }>
                      {t.priority}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{t.title}</h4>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400 line-clamp-1">{lastMsg?.text}</p>
                  <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {t.created}
                    </span>
                    <span className="flex items-center gap-1 font-bold">
                      {t.status === 'resolved' ? (
                        <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> Resolved</span>
                      ) : t.status === 'in-progress' ? (
                        <span className="text-blue-500 flex items-center gap-1"><AlertCircle className="w-2.5 h-2.5" /> Staff Assigned</span>
                      ) : (
                        <span className="text-amber-500 flex items-center gap-1"><MessageSquare className="w-2.5 h-2.5" /> Open</span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Right Side: Chat / Ticket Thread Detail */}
        <Card className="lg:col-span-4 border-none shadow-sm flex flex-col overflow-hidden bg-slate-900/40 dark:bg-slate-950/50 backdrop-blur-xl text-slate-100">
          {selectedTicket ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-slate-850 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-400">{selectedTicket.id}</span>
                    <Badge variant="outline" className="border-slate-800 text-slate-400 font-bold text-[9px] px-2 py-0.5 uppercase">{selectedTicket.category}</Badge>
                  </div>
                  <h3 className="text-sm font-bold mt-1 text-slate-100">{selectedTicket.title}</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  {selectedTicket.status === 'resolved' ? (
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold">Resolved</Badge>
                  ) : (
                    <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-bold animate-pulse">Staff Handling</Badge>
                  )}
                </div>
              </div>

              {/* Message History */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {selectedTicket.messages.map((m) => {
                    const isStaff = m.sender === 'fcos_staff';
                    return (
                      <div key={m.id} className={`flex gap-3 max-w-[85%] ${isStaff ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}>
                        <div className={`p-2.5 rounded-2xl text-xs leading-relaxed space-y-1 ${
                          isStaff 
                            ? 'bg-slate-900 border border-slate-850 rounded-tl-none text-slate-300' 
                            : 'bg-primary text-primary-foreground rounded-tr-none'
                        }`}>
                          <div className="flex items-center justify-between gap-4 text-[9px] opacity-70 font-bold uppercase tracking-wider">
                            <span>{m.senderName}</span>
                            <span>{m.timestamp}</span>
                          </div>
                          <p>{m.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Message Input Form */}
              <div className="p-4 border-t border-slate-850 bg-slate-950/20">
                {selectedTicket.status === 'resolved' ? (
                  <div className="flex items-center justify-center p-3 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" />
                    <span className="text-xs text-slate-400 font-bold uppercase">This ticket has been resolved and closed. Reopen if needed.</span>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" className="h-10 w-10 p-0 border-slate-850 bg-slate-900 text-slate-400 hover:bg-slate-800" onClick={() => toast.info("Attachment uploaded")}>
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Input 
                      placeholder="Type your message details here..." 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="h-10 border-slate-850 bg-slate-900 text-xs rounded-xl flex-1 focus-visible:ring-primary"
                    />
                    <Button type="submit" size="sm" className="h-10 w-10 p-0 rounded-xl bg-primary hover:bg-primary/95 shadow-md shadow-primary/20">
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <LifeBuoy className="w-12 h-12 text-slate-650" />
              <h3 className="text-sm font-bold text-slate-350">No ticket selected</h3>
              <p className="text-xs text-slate-400">Select an item from the sidebar registry logs to open support chat.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
