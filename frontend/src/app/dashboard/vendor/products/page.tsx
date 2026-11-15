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
  Plus, 
  Upload, 
  Download, 
  Search, 
  Filter, 
  Edit3, 
  Layers,
  FileSpreadsheet,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { useInventory } from '@/hooks/use-inventory';
import { ImportModal } from '@/components/inventory/import-modal';
import { AddProductModal } from '@/components/inventory/add-product-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const { products, isLoading, deleteProduct } = useInventory();
  const [search, setSearch] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredProducts = products ? products.filter((p: any) => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
  ) : [];

  const handleExport = () => {
    if (!filteredProducts.length) {
      toast.error('No products to export');
      return;
    }
    const exportData = filteredProducts.map((p: any) => ({
      SKU: p.sku,
      Name: p.name,
      Description: p.description || '',
      Category: p.category || '',
      Price: p.price,
      Weight: p.weight || '',
      Barcode: p.barcode || ''
    }));
    
    // We import dynamically or directly call exportToCsv
    import('@/lib/export-csv').then((m) => {
      m.exportToCsv('products_catalog_export', exportData);
      toast.success('Products exported to CSV.');
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await deleteProduct.mutateAsync(id);
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    } catch (err) {}
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Products Catalog</h2>
          <p className="text-muted-foreground font-medium">Manage product details, SKU codes, prices, and sync channels.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 rounded-xl border-slate-200" onClick={() => setIsImportOpen(true)}>
            <Upload className="h-4 w-4" /> Import CSV / Excel
          </Button>
          <Button variant="outline" className="gap-2 rounded-xl border-slate-200" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export Catalog
          </Button>
          <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search by name, SKU, or category..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl border-slate-200"
          />
        </div>
      </div>

      {/* Products list card */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">Catalog Items</CardTitle>
          <CardDescription className="text-xs">Database inventory SKUs registered under your vendor account.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-xs font-black uppercase tracking-wider text-slate-450">SKU Code</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-wider text-slate-450">Product Name</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-wider text-slate-450">Category</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-wider text-slate-450 text-right">Price</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-wider text-slate-450 text-center">Weight</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-wider text-slate-450 text-center">Barcode</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-wider text-slate-450 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className="py-4">
                      <Skeleton className="h-6 w-full rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-400 font-bold">
                    No products in catalog. Click 'Add Product' or 'Import' to start.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product: any) => (
                  <TableRow 
                    key={product.id} 
                    className="border-slate-100 hover:bg-slate-50/50 transition-colors"
                  >
                    <TableCell className="font-mono text-xs font-bold text-slate-700">{product.sku}</TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-slate-900">{product.name}</span>
                        <span className="text-xs text-slate-400 line-clamp-1">{product.description || 'No description'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-600">
                      {product.category ? (
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 rounded-full font-bold">
                          {product.category}
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-sm font-bold text-right text-slate-900">₹{parseFloat(product.price || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-center font-medium text-slate-600">
                      {product.weight ? `${product.weight} kg` : '-'}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs text-slate-500">
                      {product.barcode || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          onClick={() => handleDelete(product.id, product.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Import Modal */}
      <ImportModal 
        open={isImportOpen} 
        onOpenChange={setIsImportOpen} 
      />

      {/* Add Product Modal */}
      <AddProductModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen} 
      />
    </div>
  );
}
