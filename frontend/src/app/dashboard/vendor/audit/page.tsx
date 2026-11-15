'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Lock, 
  Calendar, 
  Globe, 
  Key, 
  FileCheck2,
  RefreshCw,
  Clock,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  category: 'Catalog' | 'Settings' | 'Security' | 'Team' | 'API';
  description: string;
  ip: string;
  hash: string;
}

const initialLogs: AuditLog[] = [
  { id: 'AUD-902', timestamp: '2026-05-27 10:14:02', actor: 'John Doe (Inventory Lead)', category: 'Catalog', description: 'SKU ECO-TEE-BLK-S inventory safety threshold modified from 20 to 30 units.', ip: '73.142.92.10 (Oakland, CA)', hash: 'sha256:d8b2e1f4...6a8b2' },
  { id: 'AUD-901', timestamp: '2026-05-27 09:40:15', actor: 'John Doe (Inventory Lead)', category: 'API', description: 'Triggered manual sync of sales channels with Shopify API endpoint.', ip: '73.142.92.10 (Oakland, CA)', hash: 'sha256:5e4a8b2c...ff12a' },
  { id: 'AUD-900', timestamp: '2026-05-26 15:30:22', actor: 'Alice Smith (Vendor Admin)', category: 'Settings', description: 'Packaging guidelines changed from "Premium" to "Eco-Friendly Pack".', ip: '108.42.110.5 (Newark, NJ)', hash: 'sha256:9f4e2c1b...24da8' },
  { id: 'AUD-899', timestamp: '2026-05-26 11:15:00', actor: 'Alice Smith (Vendor Admin)', category: 'Team', description: 'Assigned "Inventory Manager" role permissions scope to John Doe.', ip: '108.42.110.5 (Newark, NJ)', hash: 'sha256:3a2b1c4d...92e10' },
  { id: 'AUD-898', timestamp: '2026-05-25 10:00:12', actor: 'System webhook (Shopify)', category: 'API', description: 'Automated webhook registration of Order FCOS-SH-4410 successfully verified.', ip: 'Shopify-Sync Engine', hash: 'sha256:0f4b2a8d...bc421' },
];

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = logs.filter(l => 
    l.actor.toLowerCase().includes(search.toLowerCase()) ||
    l.description.toLowerCase().includes(search.toLowerCase()) ||
    l.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Activity Audit</h2>
          <p className="text-muted-foreground font-medium">Immutable audit trails verifying operations activity, product configurations, and team permission changes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 rounded-xl border-slate-200 dark:border-slate-800" onClick={() => toast.success("All cryptographic logs verified successfully.")}>
            <FileCheck2 className="h-4 w-4" /> Verify Chain Signatures
          </Button>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border border-slate-100 dark:border-slate-800 shadow-none overflow-hidden group hover:border-slate-350 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-primary/10 text-primary transition-all duration-500">
                  <Lock className="w-5 h-5" />
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 rounded-full font-bold text-[9px]">Active</Badge>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                  Log Integrity Status
                </p>
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-slate-50">
                  Fully Verified
                </h2>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide mt-1">
                  SHA-256 block ledger synchronized
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 dark:border-slate-800 shadow-none overflow-hidden group hover:border-slate-350 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 transition-all duration-500">
                  <Globe className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-slate-450 dark:text-slate-550">Last login: 10 mins ago</span>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                  Unique Locations
                </p>
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-slate-50">
                  2 IP Nodes
                </h2>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide mt-1">
                  California and New Jersey
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 dark:border-slate-800 shadow-none overflow-hidden group hover:border-slate-350 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 transition-all duration-500">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-slate-400">Security rating</span>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                  Access Control Level
                </p>
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-slate-50">
                  Role Scope (2FA)
                </h2>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide mt-1 text-emerald-500">
                  Strict authorization applied
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search audit trail by actor or action..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl border-slate-200 dark:border-slate-800"
          />
        </div>
        <Button variant="outline" className="h-10 gap-2 rounded-xl border-slate-200 dark:border-slate-800 w-full sm:w-auto">
          <Filter className="w-4 h-4" /> Filters
        </Button>
      </div>

      {/* Audit Logs Table */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">Auditable Transactions</CardTitle>
          <CardDescription className="text-xs">Immutable cryptographically signed registry of administrative and operational actions.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/40">
              <TableRow className="border-slate-100 dark:border-slate-800">
                <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400">Log ID</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400">Timestamp</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400">Actor / Operator</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400 text-center">Category</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400">Description</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400">IP Node / Location</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400 text-right">Verification</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className="border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                  <TableCell className="font-mono text-xs font-extrabold text-slate-800 dark:text-slate-300 py-4">
                    {log.id}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 dark:text-slate-455 whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {log.timestamp}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-850 dark:text-slate-200">{log.actor}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={
                      log.category === 'Security' 
                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 rounded-full font-bold text-[9px]'
                        : log.category === 'Catalog'
                          ? 'bg-primary/10 text-primary border-primary/20 rounded-full font-bold text-[9px]'
                          : log.category === 'Team'
                            ? 'bg-purple-500/10 text-purple-500 border-purple-500/20 rounded-full font-bold text-[9px]'
                            : 'bg-slate-500/10 text-slate-500 border-slate-500/20 rounded-full font-bold text-[9px]'
                    }>
                      {log.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-650 dark:text-slate-350 max-w-xs">{log.description}</TableCell>
                  <TableCell className="text-xs text-slate-500 font-medium whitespace-nowrap">{log.ip}</TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="xs" variant="outline" className="h-7 text-[10px] rounded-lg border-slate-200 dark:border-slate-800 hover:bg-slate-900 hover:text-white" onClick={() => setSelectedLog(log)}>
                          View Hash
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100 rounded-3xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <Key className="w-5 h-5 text-primary" />
                            Cryptographic Block Audit
                          </DialogTitle>
                          <DialogDescription className="text-slate-400">
                            Immutable SHA-256 checksum confirming that this transaction row record was signed by the local database vault.
                          </DialogDescription>
                        </DialogHeader>

                        {selectedLog && (
                          <div className="space-y-4 py-4 text-xs">
                            <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Log Checksum Signature</span>
                              <div className="p-3 bg-slate-950 rounded-xl font-mono text-primary text-center break-all border border-slate-850">
                                {selectedLog.hash}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider block">Operator Node</span>
                                <strong className="text-slate-300 font-bold block mt-0.5">{selectedLog.actor}</strong>
                              </div>
                              <div>
                                <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider block">Category</span>
                                <strong className="text-slate-300 font-bold block mt-0.5">{selectedLog.category} Action</strong>
                              </div>
                            </div>

                            <div className="space-y-0.5 border-t border-slate-850 pt-3">
                              <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider block">Description</span>
                              <p className="text-slate-350 leading-relaxed">{selectedLog.description}</p>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
