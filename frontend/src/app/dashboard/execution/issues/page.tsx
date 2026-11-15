'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertTriangle, 
  Plus, 
  Camera, 
  Check, 
  Clock, 
  FileText, 
  ShieldAlert,
  ChevronRight,
  Info
} from "lucide-react";
import { toast } from "sonner";

interface ReportedIssue {
  id: string;
  category: string;
  itemCode?: string;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'Reported' | 'Manager Review' | 'Assigned' | 'Resolved' | 'Closed';
  timestamp: string;
}

const initialIssues: ReportedIssue[] = [
  { id: 'ISS-102', category: 'Missing Item', itemCode: 'ECO-TEE-BLK-M', details: 'Unable to locate Black M tee in Bin B-12. Stock list states 4, shelf is empty.', severity: 'high', status: 'Manager Review', timestamp: '2026-05-27 10:15' },
  { id: 'ISS-101', category: 'Damaged Product', itemCode: 'PREM-HD-GRY-L', details: 'Fleece fabric is torn on sleeve. Moved item to quarantine zone.', severity: 'medium', status: 'Assigned', timestamp: '2026-05-26 14:02' },
];

export default function IssueReportingPage() {
  const [issues, setIssues] = useState<ReportedIssue[]>(initialIssues);
  const [category, setCategory] = useState('Missing Item');
  const [itemCode, setItemCode] = useState('');
  const [details, setDetails] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [proofPhoto, setProofPhoto] = useState(false);

  const handleSubmitIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) {
      toast.error("Please provide issue details.");
      return;
    }

    const newIssue: ReportedIssue = {
      id: `ISS-${Math.floor(103 + Math.random() * 900)}`,
      category,
      itemCode: itemCode.trim().toUpperCase() || undefined,
      details,
      severity,
      status: 'Reported',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Escalating exception to warehouse manager console...',
        success: () => {
          setIssues([newIssue, ...issues]);
          setDetails('');
          setItemCode('');
          setProofPhoto(false);
          return `Issue ${newIssue.id} logged. Manager notified.`;
        },
        error: 'Failed to submit issue.',
      }
    );
  };

  const handleTakePhoto = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 800)),
      {
        loading: 'Uploading photo proof to incident report...',
        success: () => {
          setProofPhoto(true);
          return 'Image proof attached successfully.';
        },
        error: 'Failed to upload photo.',
      }
    );
  };

  return (
    <div className="max-w-md mx-auto pt-2 pb-12 space-y-6 md:max-w-2xl animate-in fade-in">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Report Issue</h2>
          <p className="text-xs text-muted-foreground font-medium">Log inventory discrepancies or device failures</p>
        </div>
        <Badge className="bg-primary/20 text-primary border-primary/30 font-bold text-[10px] rounded-full">
          Incident Center
        </Badge>
      </div>

      {/* Issue reporting form */}
      <Card className="border-none shadow-sm bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-850">
          <span className="text-[10px] font-black uppercase text-slate-400">Escalation Console</span>
          <h3 className="font-extrabold text-lg leading-none mt-1">File Incident Exception</h3>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmitIssue} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Category</span>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="border-slate-850 bg-slate-900 text-xs rounded-xl h-10">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-850 text-slate-100">
                    <SelectItem value="Missing Item">Missing Item in Bin</SelectItem>
                    <SelectItem value="Damaged Product">Damaged Product / Fabric</SelectItem>
                    <SelectItem value="Scanner Issue">Scanner / Device failure</SelectItem>
                    <SelectItem value="Packaging Issue">Packaging shortages</SelectItem>
                    <SelectItem value="Wrong Inventory">Wrong barcode in bin</SelectItem>
                    <SelectItem value="Courier Issue">Courier arrival / delay issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Severity</span>
                <Select value={severity} onValueChange={(val: any) => setSeverity(val)}>
                  <SelectTrigger className="border-slate-850 bg-slate-900 text-xs rounded-xl h-10">
                    <SelectValue placeholder="Select Severity" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-850 text-slate-100">
                    <SelectItem value="low">Low (Minor log)</SelectItem>
                    <SelectItem value="medium">Medium (Route block)</SelectItem>
                    <SelectItem value="high">High (Delay Risk)</SelectItem>
                    <SelectItem value="critical">Critical (Stop Line)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Affected SKU / Bin Code (Optional)</span>
              <Input 
                placeholder="e.g. ECO-TEE-BLK-S or BIN-12" 
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                className="h-10 border-slate-850 bg-slate-900 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Issue Details & Context</span>
              <Textarea 
                placeholder="Please describe exactly what happened (e.g. tape dispenser jammed, bin empty, courier driver is missing)." 
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="border-slate-850 bg-slate-900 text-xs rounded-xl min-h-16"
              />
            </div>

            {/* Photo verification trigger */}
            <div className="pt-2 flex gap-2">
              <Button 
                type="button"
                onClick={handleTakePhoto}
                className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-2xl flex items-center justify-center gap-2 border border-slate-850 text-xs"
              >
                <Camera className="w-4 h-4" /> Capture Photo Proof
              </Button>
              <Button type="submit" className="px-6 h-11 text-xs font-bold rounded-2xl shadow-lg shadow-primary/20">
                File Exception
              </Button>
            </div>

            {proofPhoto && (
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase justify-center">
                <Check className="w-3.5 h-3.5" /> Proof image linked
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Reported issues list */}
      <div className="space-y-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-1">Logged Incidents History</span>
        <div className="space-y-2">
          {issues.map((issue) => (
            <div 
              key={issue.id} 
              className={`p-3.5 rounded-2xl border border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900/50 flex flex-col gap-2`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] font-bold text-slate-450">{issue.id} • {issue.category}</span>
                  <Badge className={
                    issue.severity === 'critical' || issue.severity === 'high'
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 font-bold text-[8px] rounded-full px-1 py-0'
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold text-[8px] rounded-full px-1 py-0'
                  }>
                    {issue.severity}
                  </Badge>
                </div>
                <span className="text-[9px] text-slate-400 flex items-center gap-1 font-semibold">
                  <Clock className="w-3 h-3" /> {issue.timestamp}
                </span>
              </div>
              
              <p className="text-xs text-slate-750 dark:text-slate-300 leading-normal">{issue.details}</p>
              {issue.itemCode && (
                <div className="text-[9px] font-bold text-primary font-mono uppercase">
                  Target code: {issue.itemCode}
                </div>
              )}

              <div className="border-t border-slate-100 dark:border-slate-850 pt-2 flex items-center justify-between text-[9px] text-slate-400 font-bold">
                <span className="flex items-center gap-1">
                  <Info className="w-3 h-3 text-slate-400" /> Status Flow
                </span>
                <Badge className="bg-primary/10 text-primary border-primary/20 font-bold text-[9px]">
                  {issue.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
