'use client';

import { useState } from 'react';
import { useInventory } from '@/hooks/use-inventory';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from 'lucide-react';

interface AddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProductModal({ open, onOpenChange }: AddProductModalProps) {
  const { createProduct } = useInventory();
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    price: 0,
    category: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProduct.mutateAsync(formData);
    onOpenChange(false);
    setFormData({ sku: '', name: '', description: '', price: 0, category: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl p-8 border-none shadow-2xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl font-black tracking-tight">Add New Product</DialogTitle>
          <DialogDescription className="font-medium text-slate-500">
            Create a new SKU in the system. This will be available across all warehouses.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku" className="text-xs font-bold uppercase tracking-widest text-slate-500">SKU Code</Label>
              <Input
                id="sku"
                placeholder="PROD-123"
                required
                className="rounded-xl bg-muted/60 dark:bg-muted/40 border-none h-11 font-semibold"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category" className="text-xs font-bold uppercase tracking-widest text-slate-500">Category</Label>
              <Input
                id="category"
                placeholder="Electronics"
                className="rounded-xl bg-muted/60 dark:bg-muted/40 border-none h-11 font-semibold"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-slate-500">Product Name</Label>
            <Input
              id="name"
              placeholder="iPhone 15 Pro"
              required
              className="rounded-xl bg-muted/60 dark:bg-muted/40 border-none h-11 font-semibold"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-slate-500">Description</Label>
            <Textarea
              id="description"
              placeholder="Technical specifications and details..."
              className="rounded-xl bg-muted/60 dark:bg-muted/40 border-none min-h-[100px] font-medium"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price" className="text-xs font-bold uppercase tracking-widest text-slate-500">Base Price (₹)</Label>
            <Input
              id="price"
              type="number"
              placeholder="0.00"
              required
              className="rounded-xl bg-muted/60 dark:bg-muted/40 border-none h-11 font-semibold"
              value={formData.price || ''}
              onChange={(e) => setFormData({ ...formData, price: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
            />
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createProduct.isPending}
              className="rounded-xl font-black bg-primary px-8 shadow-xl shadow-primary/20"
            >
              {createProduct.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Create Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
