'use client';

import { useReturns } from '@/hooks/use-returns';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { DataTable } from '@/components/ui/data-table-enhanced';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RotateCcw, Download, Filter, RefreshCw, Upload, Info } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { RequestReturnModal } from '@/components/returns/request-return-modal';

export default function ReturnsPage() {
  const { filters } = useQueryFilters();
  const { returns, isLoading, approveReturn, rejectReturn, refundReturn, refetch, isFetching } = useReturns(filters);

  const columns = [
    {
      header: 'Return ID',
      accessorKey: 'id',
      cell: (row: any) => <span className="font-mono font-bold text-slate-500">{row.id.substring(0, 8).toUpperCase()}</span>,
    },
    {
      header: 'Order #',
      accessorKey: 'orderNumber',
      cell: (row: any) => <span className="font-bold text-primary">{row.order?.orderNumber}</span>,
    },
    {
      header: 'Reason',
      accessorKey: 'reason',
      cell: (row: any) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{row.reason}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">{row.order?.customerName}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row: any) => {
        const variants: Record<string, string> = {
          REQUESTED: 'bg-blue-100 text-blue-700 border-blue-200',
          APPROVED: 'bg-amber-100 text-amber-700 border-amber-200',
          REFUNDED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          REJECTED: 'bg-rose-100 text-rose-700 border-rose-200',
        };
        return (
          <Badge variant="outline" className={variants[row.status] || ''}>
            {row.status}
          </Badge>
        );
      },
    },
    {
      header: 'Date',
      accessorKey: 'createdAt',
      cell: (row: any) => format(new Date(row.createdAt), 'MMM dd, yyyy'),
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: (row: any) => (
        <div className="flex gap-2">
          {row.status === 'REQUESTED' && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 rounded-lg text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                onClick={() => approveReturn.mutate(row.id)}
                disabled={approveReturn.isPending}
              >
                Approve
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50"
                onClick={() => rejectReturn.mutate(row.id)}
                disabled={rejectReturn.isPending}
              >
                Reject
              </Button>
            </>
          )}
          {row.status === 'APPROVED' && (
            <Button 
              variant="default" 
              size="sm" 
              className="h-8 rounded-lg bg-primary"
              onClick={() => refundReturn.mutate(row.id)}
              disabled={refundReturn.isPending}
            >
              Process Refund
            </Button>
          )}
        </div>
      ),
    },
  ];

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Breadcrumbs />
          <h2 className="text-3xl font-extrabold tracking-tight">Reverse Logistics</h2>
          <p className="text-muted-foreground font-medium">Manage return requests, QC inspections, and restock workflows.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            disabled={isFetching}
            className="h-9 gap-2 rounded-xl"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} /> 
            Refresh
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <Button variant="outline" className="gap-2 rounded-xl rounded-r-none h-9 border-slate-200 dark:border-slate-800 border-r-0">
                    <Upload className="h-4 w-4" /> Import
                  </Button>
                  <div className="flex items-center justify-center h-9 px-2 border border-l-0 border-slate-200 dark:border-slate-800 rounded-r-xl bg-slate-50 dark:bg-slate-800/50 cursor-help">
                    <Info className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs p-4 space-y-2 rounded-xl shadow-xl border-none text-slate-900 dark:text-white bg-white dark:bg-slate-900">
                <p className="font-bold">Import Format (CSV)</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">Headers: <span className="text-slate-700 dark:text-slate-200 font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">OrderNumber, SKU, Reason</span></p>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Maximum 500 rows per import.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button variant="outline" className="gap-2 rounded-xl h-9 border-slate-200 dark:border-slate-800">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button 
            className="gap-2 rounded-xl shadow-lg shadow-rose-500/20 bg-rose-500 hover:bg-rose-600 text-white border-none h-9"
            onClick={() => setIsReturnModalOpen(true)}
          >
            <RotateCcw className="h-4 w-4" /> New Return Request
          </Button>
        </div>
      </div>

      <DataTable 
        columns={columns as any} 
        data={returns?.returns || returns || []} 
        isLoading={isLoading} 
        searchKey="reason" 
      />

      <RequestReturnModal 
        open={isReturnModalOpen} 
        onOpenChange={setIsReturnModalOpen} 
      />
    </div>
  );
}
