'use client';

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { ShieldAlert, Search, Filter, History } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useState } from "react";

export default function AuditSecurityPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs-global', page],
    queryFn: async () => {
      const res = await api.get(`/audit-logs/global?page=${page}&limit=50`);
      return res.data;
    }
  });

  const getActionBadge = (action: string) => {
    if (action.includes('DELETE') || action.includes('DEACTIVATE') || action.includes('BLOCK') || action.includes('FAILED')) {
      return <Badge variant="destructive" className="font-mono text-[10px] uppercase">{action}</Badge>;
    }
    if (action.includes('CREATE') || action.includes('ONBOARD') || action.includes('APPROVE')) {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-mono text-[10px] uppercase">{action}</Badge>;
    }
    if (action.includes('UPDATE') || action.includes('TOGGLE') || action.includes('RETRY')) {
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-mono text-[10px] uppercase">{action}</Badge>;
    }
    return <Badge variant="outline" className="font-mono text-[10px] uppercase">{action}</Badge>;
  };

  const logs = data?.logs || [];
  
  // Client-side filtering just for the current page
  const filteredLogs = logs.filter((log: any) => {
    const searchString = `${log.user.firstName} ${log.user.lastName} ${log.user.email} ${log.module} ${log.action}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-slate-800 dark:text-slate-200" />
            Audit & Security Log
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Immutable system-wide ledger of administrative and operational actions.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by user, email, action, or module..." 
            className="pl-9 bg-transparent border-none shadow-none focus-visible:ring-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Vendor Context</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Loading security logs...
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <History className="w-8 h-8 mb-2 opacity-20" />
                    <p>No audit logs found for this search.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold text-sm">{log.user.firstName} {log.user.lastName}</p>
                        <p className="text-xs text-muted-foreground">{log.user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.user.vendor ? (
                      <Badge variant="secondary" className="font-normal">
                        {log.user.vendor.name}
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400 italic">System Admin</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {log.module}
                    </code>
                  </TableCell>
                  <TableCell>
                    {getActionBadge(log.action)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {/* Pagination Controls */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <p className="text-sm text-muted-foreground">
            Showing page {data?.page || 1} of {data?.totalPages || 1} (Total: {data?.total || 0} events)
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => p + 1)}
              disabled={page >= (data?.totalPages || 1) || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
