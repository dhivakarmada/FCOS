'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { Skeleton } from '@/components/ui/skeleton';

interface DataTableProps<TData> {
  columns: {
    header: string;
    accessorKey: keyof TData;
    cell?: (row: TData) => React.ReactNode;
  }[];
  data: TData[] | undefined;
  isLoading?: boolean;
  searchKey?: keyof TData;
}

export function DataTable<TData>({
  columns,
  data,
  isLoading,
  searchKey,
}: DataTableProps<TData>) {
  const { filters, setFilter } = useQueryFilters();

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between gap-4">
        {searchKey && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={`Search ${String(searchKey)}...`}
              value={filters[String(searchKey)] || ''}
              onChange={(event) => setFilter(String(searchKey), event.target.value)}
              className="pl-10 h-10 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:ring-primary/20"
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-10 gap-2 rounded-xl border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </Button>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white dark:bg-slate-900/50 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30">
            <TableRow className="hover:bg-transparent border-slate-100">
              {columns.map((column, index) => (
                <TableHead key={`${String(column.accessorKey)}-${index}`} className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full rounded-md" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.length ? (
              data.map((row, i) => (
                <TableRow key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 border-slate-100 transition-colors cursor-pointer">
                  {columns.map((column, index) => (
                    <TableCell key={`${String(column.accessorKey)}-${index}`} className="py-4">
                      {column.cell ? column.cell(row) : (row[column.accessorKey] as React.ReactNode)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-400">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
