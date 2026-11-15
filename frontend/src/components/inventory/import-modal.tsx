'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { Badge } from '@/components/ui/badge';

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportModal({ open, onOpenChange }: ImportModalProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isPending, setIsPending] = useState(false);
  
  // Vendor states for Super Admin
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');

  // Fetch vendors if Super Admin
  useEffect(() => {
    if (isSuperAdmin && open) {
      api.get('/vendors')
        .then(({ data }) => {
          const list = Array.isArray(data) ? data : (data.vendors || []);
          setVendors(list);
          if (list.length > 0) {
            setSelectedVendorId(list[0].id);
          }
        })
        .catch(() => {
          toast.error('Failed to load vendors');
        });
    }
  }, [isSuperAdmin, open]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const XLSX = await import('xlsx');
          const data = evt.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const json: any[] = XLSX.utils.sheet_to_json(sheet);
          
          // Normalize keys to lowercase for standard matching
          const normalized = json.map((row: any) => {
            const newRow: any = {};
            Object.keys(row).forEach((key) => {
              const normalizedKey = key.toLowerCase().replace(/[\s_-]+/g, '');
              newRow[normalizedKey] = row[key];
            });

            // Map aliases
            return {
              sku: String(newRow.sku || newRow.skucode || '').trim(),
              name: String(newRow.name || newRow.productname || newRow.title || '').trim(),
              description: newRow.description || newRow.desc || '',
              category: newRow.category || newRow.cat || '',
              price: parseFloat(newRow.price || newRow.baseprice || newRow.unitprice || '0'),
              weight: newRow.weight ? parseFloat(newRow.weight) : null,
              barcode: newRow.barcode ? String(newRow.barcode).trim() : null,
              quantity: newRow.quantity !== undefined ? parseInt(newRow.quantity) : (newRow.stock !== undefined ? parseInt(newRow.stock) : 0),
              warehouse: newRow.warehouse || newRow.warehousename || '',
              bin: newRow.bin || newRow.bincode || '',
              minStock: newRow.minstock ? parseInt(newRow.minstock) : 5,
            };
          });

          // Validate rows
          const errors: string[] = [];
          normalized.forEach((row, index) => {
            if (!row.sku) {
              errors.push(`Row ${index + 1}: Missing SKU`);
            }
            if (!row.name) {
              errors.push(`Row ${index + 1}: Missing Product Name`);
            }
            if (isNaN(row.price) || row.price < 0) {
              errors.push(`Row ${index + 1}: Invalid Price`);
            }
            if (row.quantity < 0) {
              errors.push(`Row ${index + 1}: Negative stock quantity`);
            }
          });

          setParsedData(normalized);
          setValidationErrors(errors);
        } catch (err) {
          console.error(err);
          toast.error('Error parsing file. Please ensure it is a valid Excel or CSV file.');
        }
      };
      
      reader.readAsBinaryString(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!parsedData.length) return;
    if (validationErrors.length) {
      toast.error('Please fix validation errors before uploading.');
      return;
    }
    if (isSuperAdmin && !selectedVendorId) {
      toast.error('Please select a vendor.');
      return;
    }

    setIsPending(true);
    try {
      const payload: any = { products: parsedData };
      if (isSuperAdmin) {
        payload.vendorId = selectedVendorId;
      }

      const { data } = await api.post('/inventory/products/bulk', payload);
      
      toast.success(`Import Complete! Created: ${data.created}, Updated: ${data.updated}`);
      
      // Reset state and close modal
      setFile(null);
      setParsedData([]);
      setValidationErrors([]);
      onOpenChange(false);

      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bulk import failed.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl rounded-3xl p-8 border-none shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="space-y-2 shrink-0">
          <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-primary" /> Import Product Catalog
          </DialogTitle>
          <DialogDescription className="font-medium text-slate-500">
            Upload an Excel (.xlsx, .xls) or CSV (.csv) template. Supported columns: SKU, Name, Description, Category, Price, Weight, Barcode, Stock/Quantity, Warehouse, Bin.
          </DialogDescription>
        </DialogHeader>

        {isSuperAdmin && (
          <div className="space-y-2 py-2 shrink-0 animate-fade-in">
            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Target Vendor</Label>
            <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-none text-slate-800 dark:text-slate-100 font-semibold w-full max-w-xs focus:ring-2 focus:ring-primary/20">
                <SelectValue placeholder="Select Vendor" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800">
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/30 text-center relative hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors">
            <Upload className="w-10 h-10 text-slate-450 dark:text-slate-400 mb-3" />
            <p className="text-sm text-slate-700 dark:text-slate-200 font-bold mb-1">Click to browse or drag & drop</p>
            <p className="text-xs text-slate-450 dark:text-slate-450 mb-4">CSV, XLSX, XLS up to 10MB</p>
            <Input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            {file && (
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10 font-bold rounded-full py-1 px-3 mt-2">
                {file.name}
              </Badge>
            )}
          </div>

          {validationErrors.length > 0 && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3 text-rose-800 text-xs shrink-0 animate-shake">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold uppercase tracking-wider mb-1">Validation Errors Found ({validationErrors.length})</p>
                <ul className="list-disc pl-4 space-y-0.5 font-medium max-h-32 overflow-y-auto">
                  {validationErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {parsedData.length > 0 && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">File Preview ({parsedData.length} records)</p>
                {validationErrors.length === 0 && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
                    <CheckCircle className="w-3.5 h-3.5" /> Validation Passed
                  </span>
                )}
              </div>
              <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-60 overflow-y-auto shadow-sm">
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="text-xs font-bold">SKU</TableHead>
                      <TableHead className="text-xs font-bold">Name</TableHead>
                      <TableHead className="text-xs font-bold">Category</TableHead>
                      <TableHead className="text-xs font-bold text-right">Price</TableHead>
                      <TableHead className="text-xs font-bold text-center">Starting Stock</TableHead>
                      <TableHead className="text-xs font-bold">Warehouse / Bin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row, index) => (
                      <TableRow key={index} className="hover:bg-slate-50/50">
                        <TableCell className="font-mono text-xs font-semibold text-slate-700">{row.sku}</TableCell>
                        <TableCell className="text-xs font-bold text-slate-900">{row.name}</TableCell>
                        <TableCell className="text-xs text-slate-500">{row.category || '-'}</TableCell>
                        <TableCell className="text-xs font-bold text-right text-slate-900">₹{row.price.toFixed(2)}</TableCell>
                        <TableCell className="text-xs font-bold text-center text-slate-600">{row.quantity} units</TableCell>
                        <TableCell className="text-xs text-slate-505">
                          {row.warehouse ? `${row.warehouse} (${row.bin || 'A-01-01'})` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t border-slate-100 shrink-0 gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl font-bold"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isPending || parsedData.length === 0 || validationErrors.length > 0}
            className="rounded-xl font-black bg-primary px-8 shadow-xl shadow-primary/20"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Confirm Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
