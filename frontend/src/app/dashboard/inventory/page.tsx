'use client';

import { useInventory } from '@/hooks/use-inventory';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, Download, Barcode as BarcodeIcon, ArrowRightLeft, Package, 
  Search, Filter, Trash2, CheckCircle2, AlertTriangle, TrendingUp,
  FileSpreadsheet, Sparkles, Printer, Eye, ChevronDown, ChevronUp, SlidersHorizontal,
  Loader2
} from 'lucide-react';
import { BarcodeScannerModal } from '@/components/logistics/barcode-scanner-modal';
import { ImportModal } from '@/components/inventory/import-modal';
import { BulkAdjustModal } from '@/components/inventory/bulk-adjust-modal';
import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { exportToCsv } from '@/lib/export-csv';
import { useAuthStore } from '@/store/auth-store';
import { AddProductModal } from '@/components/inventory/add-product-modal';
import { AddStockModal } from '@/components/inventory/add-stock-modal';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import Barcode from 'react-barcode';

export default function InventoryPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { filters, setFilter, clearFilters } = useQueryFilters();
  const { products, isLoading, deleteProduct } = useInventory(filters);

  // Modal open states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBulkAdjustOpen, setIsBulkAdjustOpen] = useState(false);
  
  // Scanned item tracking
  const [scannedProductId, setScannedProductId] = useState<string | undefined>();
  
  // Selection states
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [expandedProductIds, setExpandedProductIds] = useState<string[]>([]);

  // Advanced filters state
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [selectedVendorId, setSelectedVendorId] = useState<string>('all');

  // Database lists for filters
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);

  const isVendor = user?.role === 'VENDOR_ADMIN';
  const isManager = user?.role === 'WAREHOUSE_MANAGER';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Fetch predictions
  const { data: predictions } = useQuery({
    queryKey: ['inventory-predictions'],
    queryFn: async () => {
      const { data } = await api.get('/inventory/predictions');
      return data;
    }
  });

  // Fetch warehouses
  useEffect(() => {
    api.get('/warehouses')
      .then(({ data }) => setWarehouses(data))
      .catch(() => {});
    
    if (isSuperAdmin) {
      api.get('/vendors')
        .then(({ data }) => setVendors(Array.isArray(data) ? data : (data.vendors || [])))
        .catch(() => {});
    }
  }, [isSuperAdmin]);

  // Fetch stock logs for expanded rows
  const [stockLogs, setStockLogs] = useState<Record<string, any[]>>({});
  const fetchStockLogs = async (productId: string) => {
    if (stockLogs[productId]) return;
    try {
      const { data } = await api.get(`/inventory/products/${productId}/history`);
      setStockLogs(prev => ({ ...prev, [productId]: data }));
    } catch (err) {}
  };

  const toggleExpand = (productId: string) => {
    const isExpanded = expandedProductIds.includes(productId);
    if (isExpanded) {
      setExpandedProductIds(prev => prev.filter(id => id !== productId));
    } else {
      setExpandedProductIds(prev => [...prev, productId]);
      fetchStockLogs(productId);
    }
  };

  const handleScanResult = async (barcode: string) => {
    const product = products?.find((p: any) => p.sku === barcode || p.barcode === barcode);
    if (product) {
      setScannedProductId(product.id);
      setIsStockModalOpen(true);
    } else {
      setFilter('sku', barcode);
    }
    setIsScannerOpen(false);
  };

  // Perform client-side/database filtering
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter((p: any) => {
      // 1. Warehouse filter
      if (warehouseFilter !== 'all') {
        const hasWarehouse = p.inventory?.some((item: any) => item.warehouseId === warehouseFilter);
        if (!hasWarehouse) return false;
      }

      // 2. Vendor filter (Super Admin)
      if (isSuperAdmin && selectedVendorId !== 'all') {
        if (p.vendorId !== selectedVendorId) return false;
      }

      // 3. Price range
      if (minPrice && parseFloat(p.price) < parseFloat(minPrice)) return false;
      if (maxPrice && parseFloat(p.price) > parseFloat(maxPrice)) return false;

      // 4. Status filter
      const totalStock = p.inventory?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;
      if (statusFilter === 'instock' && totalStock <= 50) return false;
      if (statusFilter === 'lowstock' && (totalStock > 50 || totalStock <= 10)) return false;
      if (statusFilter === 'critical' && (totalStock > 10 || totalStock <= 0)) return false;
      if (statusFilter === 'outofstock' && totalStock > 0) return false;

      return true;
    });
  }, [products, warehouseFilter, statusFilter, minPrice, maxPrice, selectedVendorId, isSuperAdmin]);

  // Statistics calculations
  const stats = useMemo(() => {
    if (!filteredProducts.length) {
      return { totalSkus: 0, outOfStock: 0, lowStock: 0, totalValuation: 0 };
    }

    let outOfStock = 0;
    let lowStock = 0;
    let totalValuation = 0;

    filteredProducts.forEach((p: any) => {
      const stock = p.inventory?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;
      if (stock === 0) outOfStock++;
      else if (stock <= 10) lowStock++;
      
      totalValuation += stock * parseFloat(p.price || 0);
    });

    return {
      totalSkus: filteredProducts.length,
      outOfStock,
      lowStock,
      totalValuation
    };
  }, [filteredProducts]);

  // Select/Deselect handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProductIds(filteredProducts.map((p: any) => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectRow = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProductIds(prev => [...prev, productId]);
    } else {
      setSelectedProductIds(prev => prev.filter(id => id !== productId));
    }
  };

  // Export handlers
  const handleExport = (idsToExport?: string[]) => {
    const list = idsToExport 
      ? filteredProducts.filter((p: any) => idsToExport.includes(p.id))
      : filteredProducts;

    if (!list.length) {
      toast.error('No products to export');
      return;
    }

    const exportData = list.map((p: any) => ({
      SKU: p.sku,
      Name: p.name,
      Description: p.description || '',
      Category: p.category || '',
      Price: p.price,
      Weight: p.weight || '',
      Barcode: p.barcode || '',
      TotalStock: p.inventory?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0,
      Warehouses: p.inventory?.map((item: any) => `${item.warehouse?.name || 'Hub'}:${item.bin?.code || 'Bin'}:${item.quantity}`).join('; ') || ''
    }));

    exportToCsv('inventory_catalog_export', exportData);
    toast.success(`Exported ${list.length} products successfully.`);
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedProductIds.length} products?`)) return;
    
    toast.promise(
      Promise.all(selectedProductIds.map(id => deleteProduct.mutateAsync(id))),
      {
        loading: 'Deleting selected products...',
        success: () => {
          setSelectedProductIds([]);
          queryClient.invalidateQueries({ queryKey: ['inventory'] });
          return 'Selected products successfully deleted';
        },
        error: 'Failed to delete some products.',
      }
    );
  };

  const selectedProductsObjects = useMemo(() => {
    return filteredProducts.filter((p: any) => selectedProductIds.includes(p.id));
  }, [filteredProducts, selectedProductIds]);

  const handlePrintBarcode = (productId: string) => {
    const printContent = document.getElementById(`barcode-print-${productId}`);
    if (!printContent) return;
    
    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime();
    const windowName = 'PrintBarcode' + uniqueName;
    const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Barcode Label</title>
            <style>
              body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: monospace; }
              .label { text-align: center; border: 1px solid #ccc; padding: 20px; border-radius: 8px; }
            </style>
          </head>
          <body>
            <div class="label">
              ${printContent.innerHTML}
            </div>
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Breadcrumbs />
          <h2 className="text-3xl font-extrabold tracking-tight">Inventory Control</h2>
          <p className="text-muted-foreground font-medium">Advanced WMS Stock management with barcode triggers and analytics forecasting.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" className="gap-2 rounded-xl h-10 border-slate-200" onClick={() => setIsScannerOpen(true)}>
            <BarcodeIcon className="h-4 w-4" /> Scan SKU
          </Button>
          <Button variant="outline" className="gap-2 rounded-xl h-10 border-slate-200" onClick={() => setIsImportModalOpen(true)}>
            <FileSpreadsheet className="h-4 w-4" /> Import
          </Button>
          <Button variant="outline" className="gap-2 rounded-xl h-10 border-slate-200" onClick={() => handleExport()}>
            <Download className="h-4 w-4" /> Export All
          </Button>
          
          {isVendor && (
            <Button className="gap-2 rounded-xl h-10 shadow-lg shadow-primary/20" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          )}

          {(isVendor || isManager || isSuperAdmin) && (
            <Button className="gap-2 rounded-xl h-10 shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700" onClick={() => setIsStockModalOpen(true)}>
              <Plus className="h-4 w-4" /> Add Stock
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-500/5 to-indigo-600/[0.02]">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total SKUs</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{isLoading ? '-' : stats.totalSkus}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Catalog products count</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-rose-500/5 to-rose-600/[0.02]">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-rose-500/10 text-rose-600 rounded-2xl shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Out of Stock</p>
              <h3 className="text-2xl font-black text-rose-600 mt-1 tracking-tight">{isLoading ? '-' : stats.outOfStock}</h3>
              <p className="text-[10px] text-slate-450 mt-0.5">Require immediate reorder</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-amber-500/5 to-amber-600/[0.02]">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Low Stock Risks</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1 tracking-tight">{isLoading ? '-' : stats.lowStock}</h3>
              <p className="text-[10px] text-slate-450 mt-0.5">Under threshold limit (&lt;=10)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-500/5 to-emerald-600/[0.02]">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Valuation</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
                {isLoading ? '-' : `₹${stats.totalValuation.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Product quantity valuation</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters Panel */}
      <Card className="border-none shadow-sm bg-slate-50/50 dark:bg-slate-900/10 p-5 rounded-2xl">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" /> Filters
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-5">
            {/* Warehouse select */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Warehouse</Label>
              <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                <SelectTrigger className="h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="All Warehouses" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800">
                  <SelectItem value="all">All Locations</SelectItem>
                  {warehouses.map(wh => (
                    <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status select */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stock Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-955 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="instock">In Stock (&gt;50)</SelectItem>
                  <SelectItem value="lowstock">Low Stock (10-50)</SelectItem>
                  <SelectItem value="critical">Critical Stock (&lt;=10)</SelectItem>
                  <SelectItem value="outofstock">Out of Stock (0)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price filters */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Min Price (₹)</Label>
              <Input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Max Price (₹)</Label>
              <Input
                type="number"
                placeholder="100000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold"
              />
            </div>

            {/* Vendor filter (Super Admin) */}
            {isSuperAdmin && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vendor</Label>
                <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                  <SelectTrigger className="h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="All Vendors" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800">
                    <SelectItem value="all">All Vendors</SelectItem>
                    {vendors.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          {(warehouseFilter !== 'all' || statusFilter !== 'all' || minPrice || maxPrice || selectedVendorId !== 'all') && (
            <div className="flex justify-end pt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setWarehouseFilter('all');
                  setStatusFilter('all');
                  setMinPrice('');
                  setMaxPrice('');
                  setSelectedVendorId('all');
                  clearFilters();
                }}
                className="text-xs font-bold text-rose-500 hover:bg-rose-50"
              >
                Clear Advanced Filters
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Main Inventory Table */}
      <Card className="border-none shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[40px] text-center">
                <Checkbox
                  checked={filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[30px]"></TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase">SKU</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase">Product Details</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase text-right">Price</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase text-center">Stock Level</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase text-center">Daily Velocity</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase text-center">Status</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={9} className="py-6">
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-20 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Package className="w-12 h-12 text-slate-350" />
                    <p className="font-bold text-slate-700">No inventory entries found matching filters.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((p: any) => {
                const totalStock = p.inventory?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;
                const pred = predictions?.find((pred: any) => pred.productId === p.id);
                const isExpanded = expandedProductIds.includes(p.id);
                
                let status = totalStock > 50 ? 'In Stock' : totalStock > 10 ? 'Low Stock' : 'Critical';
                let stockoutDays = null;
                
                if (pred?.isWarning) {
                  status = 'Stockout Risk';
                  stockoutDays = pred.stockoutDays;
                }
                if (totalStock === 0) {
                  status = 'Out of Stock';
                }

                const statusVariants: Record<string, string> = {
                  'In Stock': 'bg-emerald-50 text-emerald-700 border-emerald-100',
                  'Low Stock': 'bg-amber-50 text-amber-700 border-amber-100',
                  'Critical': 'bg-rose-50 text-rose-700 border-rose-100',
                  'Stockout Risk': 'bg-red-500 text-white border-red-600 font-black animate-pulse',
                  'Out of Stock': 'bg-slate-100 text-slate-550 border-slate-200'
                };

                return (
                  <>
                    <TableRow key={p.id} className={`hover:bg-slate-50/50 cursor-pointer ${isExpanded ? 'bg-slate-50/30' : ''}`}>
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedProductIds.includes(p.id)}
                          onCheckedChange={(checked) => handleSelectRow(p.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell onClick={() => toggleExpand(p.id)}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="font-mono font-bold text-slate-700" onClick={() => toggleExpand(p.id)}>{p.sku}</TableCell>
                      <TableCell className="py-4" onClick={() => toggleExpand(p.id)}>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-slate-900">{p.name}</span>
                          <span className="text-[10px] text-slate-400 line-clamp-1 max-w-[200px]">{p.description || 'No description'}</span>
                          {p.vendor && (
                            <Badge variant="outline" className="text-[8px] px-1 py-0 bg-slate-50 border-slate-200 mt-1 w-max font-bold text-slate-500">
                              {p.vendor.name}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-right text-slate-800" onClick={() => toggleExpand(p.id)}>
                        ₹{parseFloat(p.price || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-800" onClick={() => toggleExpand(p.id)}>
                        {totalStock} units
                      </TableCell>
                      <TableCell className="text-center" onClick={() => toggleExpand(p.id)}>
                        {pred && pred.dailyVelocity !== '0.00' ? (
                          <span className="font-bold text-slate-600">{pred.dailyVelocity}/day</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center" onClick={() => toggleExpand(p.id)}>
                        <div className="flex flex-col gap-1 items-center">
                          <Badge variant="outline" className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusVariants[status] || statusVariants['In Stock']}`}>
                            {status}
                          </Badge>
                          {stockoutDays !== null && (
                            <span className="text-[9px] text-red-600 font-extrabold uppercase tracking-wide">
                              Runs out in {stockoutDays}d
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2.5 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold"
                            onClick={() => {
                              setScannedProductId(p.id);
                              setIsStockModalOpen(true);
                            }}
                          >
                            <ArrowRightLeft className="h-4 w-4 mr-1" /> Add Stock
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                                 {/* Expandable Panel */}
                    {isExpanded && (
                      <TableRow className="bg-slate-50/20 hover:bg-slate-50/20 border-slate-100 dark:border-slate-850">
                        <TableCell colSpan={9} className="p-0">
                          <div className="px-10 py-6 grid grid-cols-1 md:grid-cols-12 gap-8 text-xs border-t border-b border-slate-100 dark:border-slate-850 animate-fade-in">
                            
                            {/* Bins list */}
                            <div className="md:col-span-4 space-y-3">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Warehouse Storage Breakdown</h4>
                              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/50 shadow-sm">
                                <Table>
                                  <TableHeader className="bg-slate-50 dark:bg-slate-800/30">
                                    <TableRow>
                                      <TableHead className="text-xs font-bold">Warehouse</TableHead>
                                      <TableHead className="text-xs font-bold text-center">Bin</TableHead>
                                      <TableHead className="text-xs font-bold text-right">Fulfillable Stock</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {!p.inventory || p.inventory.length === 0 ? (
                                      <TableRow>
                                        <TableCell colSpan={3} className="text-center py-6 text-slate-400 font-medium">
                                          No stock allocated in any warehouse.
                                        </TableCell>
                                      </TableRow>
                                    ) : (
                                      p.inventory.map((item: any) => (
                                        <TableRow key={item.id}>
                                          <TableCell className="font-bold text-slate-700 dark:text-slate-300">{item.warehouse?.name || 'Hub'}</TableCell>
                                          <TableCell className="text-center font-mono font-bold text-indigo-650 dark:text-indigo-400">{item.bin?.code || 'Unassigned'}</TableCell>
                                          <TableCell className="text-right font-extrabold text-slate-800 dark:text-slate-200">{item.quantity} units</TableCell>
                                        </TableRow>
                                      ))
                                    )}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>

                            {/* Barcode & labels */}
                            <div className="md:col-span-3 flex flex-col items-center justify-between border-l border-r border-slate-100 dark:border-slate-800 px-6 py-2">
                              <div className="text-center space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Barcode Tag</h4>
                                <div id={`barcode-print-${p.id}`} className="bg-white p-3 border border-slate-200 rounded-2xl inline-block shadow-sm">
                                  <Barcode 
                                    value={p.barcode || p.sku} 
                                    width={1.2} 
                                    height={50} 
                                    fontSize={10}
                                    margin={0}
                                  />
                                </div>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full gap-2 rounded-xl mt-4 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200" 
                                onClick={() => handlePrintBarcode(p.id)}
                              >
                                <Printer className="w-3.5 h-3.5" /> Print Barcode Label
                              </Button>
                            </div>

                            {/* Forecasting / Predictions info */}
                            <div className="md:col-span-2 space-y-3">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Velocity & Forecast</h4>
                              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 h-[calc(100%-24px)] flex flex-col justify-between">
                                <div className="space-y-3">
                                  <div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Daily Velocity</span>
                                    <span className="text-sm font-black text-slate-800 dark:text-slate-100">{pred?.dailyVelocity || '0.00'} units/day</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Days left</span>
                                    <span className={`text-sm font-black ${pred?.isWarning ? 'text-rose-600' : 'text-slate-850 dark:text-slate-100'}`}>
                                      {pred && pred.stockoutDays !== null ? `${pred.stockoutDays} days` : 'Unlimited'}
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase block mb-1">Recommended Reorder</span>
                                  <Badge className="bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/10 border-none font-bold rounded-lg py-1 px-2 text-[10px]">
                                    {pred?.suggestedReorder ? `${pred.suggestedReorder} units` : 'Optimum'}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {/* Stock history log */}
                            <div className="md:col-span-3 space-y-3">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Movements Log</h4>
                              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden h-[calc(100%-24px)] overflow-y-auto max-h-48 p-3 space-y-2">
                                {!stockLogs[p.id] ? (
                                  <div className="flex items-center justify-center h-full text-slate-450 font-medium">
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Fetching activity...
                                  </div>
                                ) : stockLogs[p.id].length === 0 ? (
                                  <div className="flex items-center justify-center h-full text-slate-400 font-medium">
                                    No stock movement logged.
                                  </div>
                                ) : (
                                  stockLogs[p.id].map((log) => (
                                    <div key={log.id} className="flex justify-between items-start border-b border-slate-50 dark:border-slate-800 pb-2 last:border-b-0 last:pb-0">
                                      <div>
                                        <p className="font-bold text-slate-850 dark:text-slate-200 leading-tight">
                                          {log.type === 'INBOUND' ? 'Stock Added' : log.type === 'OUTBOUND' ? 'Stock Reduced' : 'Stock Moved'}
                                        </p>
                                        <p className="text-[9px] text-slate-400 dark:text-slate-450 font-semibold">{log.reason || 'Manual count update'}</p>
                                        <p className="text-[8px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">By {log.performedBy ? `${log.performedBy.firstName}` : 'System'}</p>
                                      </div>
                                      <span className={`font-black ${log.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange}
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Floating Bulk Actions Bar */}
      {selectedProductIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-800 text-white rounded-3xl py-4 px-6 flex items-center gap-6 shadow-2xl animate-fade-in">
          <span className="text-xs font-bold tracking-wide">
            {selectedProductIds.length} items selected
          </span>
          <div className="w-px h-6 bg-slate-800" />
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-9 hover:bg-slate-800 text-slate-200 font-bold hover:text-white rounded-xl gap-1.5"
              onClick={() => handleExport(selectedProductIds)}
            >
              <Download className="w-4 h-4" /> Export Selected
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-9 hover:bg-slate-800 text-slate-200 font-bold hover:text-white rounded-xl gap-1.5"
              onClick={() => setIsBulkAdjustOpen(true)}
            >
              <ArrowRightLeft className="w-4 h-4" /> Bulk Adjust
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-9 hover:bg-red-950/40 text-red-400 hover:text-red-300 font-bold rounded-xl gap-1.5"
              onClick={handleBulkDelete}
            >
              <Trash2 className="w-4 h-4" /> Delete SKUs
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <BarcodeScannerModal 
        open={isScannerOpen} 
        onOpenChange={setIsScannerOpen} 
        onResult={handleScanResult}
        title="SKU / Barcode Scanner"
        description="Scan any product barcode to instantly locate it in inventory."
      />

      <AddProductModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen} 
      />

      <AddStockModal 
        open={isStockModalOpen} 
        onOpenChange={(open) => {
          setIsStockModalOpen(open);
          if (!open) setScannedProductId(undefined);
        }} 
        initialProductId={scannedProductId}
      />

      <ImportModal 
        open={isImportModalOpen} 
        onOpenChange={setIsImportModalOpen} 
      />

      <BulkAdjustModal 
        open={isBulkAdjustOpen} 
        onOpenChange={setIsBulkAdjustOpen} 
        selectedProducts={selectedProductsObjects}
        onSuccess={() => setSelectedProductIds([])}
      />
    </div>
  );
}
