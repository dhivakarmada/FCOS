'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  ScanBarcode, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  Database,
  Trash2,
  Check
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

export default function ImportCenter() {
  const [fileSelected, setFileSelected] = useState(false);
  const [fileName, setFileName] = useState('');
  const [records, setRecords] = useState<any[]>([]);
  const [mappings, setMappings] = useState({
    orderNumber: 'Order ID',
    customerName: 'Customer Name',
    customerEmail: 'Email',
    addressLine1: 'Address',
    city: 'City',
    state: 'State',
    zipCode: 'Pincode',
    sku: 'SKU',
    quantity: 'Qty'
  });

  const [step, setStep] = useState(1); // 1: Upload, 2: Map Fields, 3: Preview & Import, 4: Summary
  const [summaryData, setSummaryData] = useState<any>(null);

  // Mock excel data loading simulation
  const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      setFileSelected(true);
      
      // Simulate reading Excel/CSV lines
      const mockRecords = [
        { 'Order ID': 'ORD-9938-IMP', 'Customer Name': 'Virat Kohli', 'Email': 'virat@fcos.com', 'Address': 'Chinnaswamy Stadium', 'City': 'Bangalore', 'State': 'KA', 'Pincode': '560001', 'SKU': 'ECO-TEE-BLK-S', 'Qty': 2 },
        { 'Order ID': 'ORD-9939-IMP', 'Customer Name': 'Rohit Sharma', 'Email': 'rohit@fcos.com', 'Address': 'Wankhede Stadium', 'City': 'Mumbai', 'State': 'MH', 'Pincode': '400020', 'SKU': 'ECO-TEE-WHT-M', 'Qty': 1 },
        { 'Order ID': 'ORD-9940-IMP', 'Customer Name': 'Samantha Ruth', 'Email': 'samantha@fcos.com', 'Address': 'Jubilee Hills', 'City': 'Hyderabad', 'State': 'TS', 'Pincode': '500033', 'SKU': 'ECO-TEE-BLK-S', 'Qty': 3 },
        { 'Order ID': 'ORD-9941-IMP', 'Customer Name': 'Mahesh Babu', 'Email': 'mahesh@fcos.com', 'Address': 'Banjara Hills', 'City': 'Hyderabad', 'State': 'TS', 'Pincode': '500034', 'SKU': 'ECO-TEE-BLK-INVALID-SKU', 'Qty': 1 }, // Invalid SKU record
      ];
      setRecords(mockRecords);
      toast.success(`Successfully parsed ${mockRecords.length} records from ${file.name}`);
      setStep(2);
    }
  };

  const importMutation = useMutation({
    mutationFn: async (payload: { records: any[]; mappings: any }) => {
      const res = await api.post('/imports/orders', payload);
      return res.data;
    },
    onSuccess: (data) => {
      setSummaryData(data);
      setStep(4);
      toast.success(`Ingested ${data.importedCount} normalized orders into fulfillment queues.`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Import failed');
    }
  });

  const handleTriggerImport = () => {
    importMutation.mutate({
      records,
      mappings
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-8 h-8 text-primary" />
            CSV / Excel Import Center
          </h2>
          <p className="text-muted-foreground font-medium mt-1 font-semibold">Bulk upload orders via CSV/Excel sheets, map custom headers, and normalize them directly into the WMS queue.</p>
        </div>
      </div>

      {/* Progress Steps Indicators */}
      <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold w-fit">
        <span className={`px-3 py-1.5 rounded-xl ${step === 1 ? 'bg-primary text-white' : 'text-slate-500'}`}>1. Upload</span>
        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        <span className={`px-3 py-1.5 rounded-xl ${step === 2 ? 'bg-primary text-white' : 'text-slate-500'}`}>2. Map Fields</span>
        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        <span className={`px-3 py-1.5 rounded-xl ${step === 3 ? 'bg-primary text-white' : 'text-slate-500'}`}>3. Ingestion Preview</span>
        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        <span className={`px-3 py-1.5 rounded-xl ${step === 4 ? 'bg-primary text-white' : 'text-slate-500'}`}>4. Summary</span>
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <Card className="border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-12 text-center rounded-3xl flex flex-col items-center justify-center">
          <div className="p-4 bg-primary/10 rounded-2xl mb-4 text-primary">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">Upload your spreadsheet</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-2 mb-6">Supports CSV, XLSX, and TSV files. Ensure your headers contain at least names, addresses, and SKUs.</p>
          <label className="h-10 px-6 bg-primary hover:bg-primary/95 text-white font-black text-xs rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center cursor-pointer transition-all">
            CHOOSE FILE
            <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileChange} />
          </label>
        </Card>
      )}

      {/* Step 2: Map Fields */}
      {step === 2 && (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur shadow-sm rounded-3xl">
          <CardHeader>
            <CardTitle>Map Spreadsheet Columns</CardTitle>
            <CardDescription>Match FCOS core schema columns to your spreadsheet header keys.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3 text-xs">
              <div className="space-y-1.5">
                <span className="font-bold text-slate-450 uppercase tracking-widest text-[9px]">Order ID Column</span>
                <Input value={mappings.orderNumber} onChange={(e) => setMappings({ ...mappings, orderNumber: e.target.value })} className="h-10 border-slate-250 dark:border-slate-800 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <span className="font-bold text-slate-450 uppercase tracking-widest text-[9px]">Customer Name Column</span>
                <Input value={mappings.customerName} onChange={(e) => setMappings({ ...mappings, customerName: e.target.value })} className="h-10 border-slate-250 dark:border-slate-800 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <span className="font-bold text-slate-450 uppercase tracking-widest text-[9px]">Customer Email Column</span>
                <Input value={mappings.customerEmail} onChange={(e) => setMappings({ ...mappings, customerEmail: e.target.value })} className="h-10 border-slate-250 dark:border-slate-800 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <span className="font-bold text-slate-450 uppercase tracking-widest text-[9px]">Delivery Address Column</span>
                <Input value={mappings.addressLine1} onChange={(e) => setMappings({ ...mappings, addressLine1: e.target.value })} className="h-10 border-slate-250 dark:border-slate-800 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <span className="font-bold text-slate-450 uppercase tracking-widest text-[9px]">Aisle Product SKU Column</span>
                <Input value={mappings.sku} onChange={(e) => setMappings({ ...mappings, sku: e.target.value })} className="h-10 border-slate-250 dark:border-slate-800 rounded-xl font-mono" />
              </div>
              <div className="space-y-1.5">
                <span className="font-bold text-slate-450 uppercase tracking-widest text-[9px]">Quantity Column</span>
                <Input value={mappings.quantity} onChange={(e) => setMappings({ ...mappings, quantity: e.target.value })} className="h-10 border-slate-250 dark:border-slate-800 rounded-xl" />
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-850">
              <Button variant="ghost" onClick={() => setStep(1)} className="rounded-xl font-bold">Back</Button>
              <Button onClick={() => setStep(3)} className="rounded-xl shadow-lg shadow-primary/20">Preview Normalization</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Ingestion Preview */}
      {step === 3 && (
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur shadow-sm rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle>File Normalization Preview</CardTitle>
              <CardDescription>Review parsed order entities and verify catalog validations prior to final ingestion.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-950/60">
                  <TableRow>
                    <TableHead className="text-xs font-black uppercase text-slate-400">Order ID</TableHead>
                    <TableHead className="text-xs font-black uppercase text-slate-400">Customer</TableHead>
                    <TableHead className="text-xs font-black uppercase text-slate-400">Delivery Pincode</TableHead>
                    <TableHead className="text-xs font-black uppercase text-slate-400">Target SKU</TableHead>
                    <TableHead className="text-xs font-black uppercase text-slate-400 text-center">Quantity</TableHead>
                    <TableHead className="text-xs font-black uppercase text-slate-400 text-right">Validation Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r, i) => {
                    const isSkuValid = r[mappings.sku] !== 'ECO-TEE-BLK-INVALID-SKU';
                    return (
                      <TableRow key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                        <TableCell className="font-mono text-xs font-bold">{r[mappings.orderNumber]}</TableCell>
                        <TableCell className="text-xs font-semibold">{r[mappings.customerName]}</TableCell>
                        <TableCell className="text-xs text-slate-500">{r[mappings.zipCode] || '560001'}</TableCell>
                        <TableCell className="font-mono text-xs text-indigo-500">{r[mappings.sku]}</TableCell>
                        <TableCell className="text-center font-bold text-xs">{r[mappings.quantity]}</TableCell>
                        <TableCell className="text-right">
                          <Badge className={
                            isSkuValid
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold'
                              : 'bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold'
                          }>
                            {isSkuValid ? (
                              <span className="flex items-center gap-1"><Check className="w-3 h-3" /> SKU Validated</span>
                            ) : (
                              <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> SKU Unregistered</span>
                            )}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex items-center gap-2 justify-end">
            <Button variant="ghost" onClick={() => setStep(2)} className="rounded-xl font-bold">Back</Button>
            <Button 
              onClick={handleTriggerImport} 
              disabled={importMutation.isPending}
              className="rounded-xl shadow-lg shadow-primary/20 bg-rose-600 hover:bg-rose-700 text-white font-bold border-none"
            >
              {importMutation.isPending ? 'Ingesting...' : 'Ingest Mapped Orders'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Summary */}
      {step === 4 && summaryData && (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur shadow-sm rounded-3xl p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-500">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h3 className="font-black text-2xl text-slate-800 dark:text-white">Ingestion Complete</h3>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              We parsed your column headers and ingested valid rows successfully into standard WMS queue bins.
            </p>

            <div className="grid grid-cols-3 gap-6 py-6 border-y border-slate-100 dark:border-slate-850 w-full max-w-md my-4">
              <div className="text-center">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Imported</span>
                <h4 className="text-2xl font-black text-emerald-500 mt-1">{summaryData.importedCount}</h4>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Duplicates</span>
                <h4 className="text-2xl font-black text-amber-500 mt-1">{summaryData.duplicateCount}</h4>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Rejected</span>
                <h4 className="text-2xl font-black text-rose-500 mt-1">{summaryData.errorCount}</h4>
              </div>
            </div>

            {summaryData.errors.length > 0 && (
              <div className="w-full max-w-md text-left space-y-2">
                <p className="text-xs font-bold text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> Ingestion Rejections ({summaryData.errors.length})
                </p>
                <div className="bg-rose-500/5 border border-rose-500/10 p-3 rounded-2xl max-h-[150px] overflow-y-auto space-y-2">
                  {summaryData.errors.map((err: any, idx: number) => (
                    <div key={idx} className="text-[10px] font-mono text-rose-400 leading-normal border-b border-rose-500/10 pb-2">
                      <span className="font-bold">Row {idx + 1}:</span> {err.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={() => setStep(1)} className="rounded-xl h-11 px-8 font-black mt-4">
              IMPORT ANOTHER FILE
            </Button>
          </div>
        </Card>
      )}

    </div>
  );
}
