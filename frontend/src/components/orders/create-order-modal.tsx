'use client';

import { useState } from 'react';
import { useOrders } from '@/hooks/use-orders';
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CreateOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrderModal({ open, onOpenChange }: CreateOrderModalProps) {
  const { createOrder } = useOrders();
  const { products } = useInventory();
  
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [items, setItems] = useState([{ productId: '', quantity: 1 }]);

  const addItem = () => setItems([...items, { productId: '', quantity: 1 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createOrder.mutateAsync({
      customerName,
      customerEmail,
      customerPhone,
      addressLine1,
      city,
      state,
      zipCode,
      items: items.filter(i => i.productId && i.quantity > 0)
    });
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setItems([{ productId: '', quantity: 1 }]);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setAddressLine1('');
    setCity('');
    setState('');
    setZipCode('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] rounded-3xl p-8 border-none shadow-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" />
            Create Direct Order
          </DialogTitle>
          <DialogDescription className="font-medium text-slate-500">
            Generate a new fulfillment request. This will reduce stock and notify the warehouse staff.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-4 bg-muted/50 dark:bg-muted/30 p-6 rounded-2xl border border-border">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-1">Customer Profile</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Input
                  placeholder="Full Name"
                  required
                  className="rounded-xl border-none h-11 font-semibold bg-background shadow-sm"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="Email Address"
                  type="email"
                  required
                  className="rounded-xl border-none h-11 font-semibold bg-background shadow-sm"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-1">
                <Input
                  placeholder="Phone Number"
                  className="rounded-xl border-none h-11 font-semibold bg-background shadow-sm"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2 col-span-1">
                <Input
                  placeholder="Street Address"
                  required
                  className="rounded-xl border-none h-11 font-semibold bg-background shadow-sm"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                placeholder="City"
                required
                className="rounded-xl border-none h-11 font-semibold bg-background shadow-sm"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <Input
                placeholder="State"
                required
                className="rounded-xl border-none h-11 font-semibold bg-background shadow-sm"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
              <Input
                placeholder="Zip Code"
                required
                className="rounded-xl border-none h-11 font-semibold bg-background shadow-sm"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-1">Order Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-8 rounded-lg gap-1.5 text-xs font-black uppercase tracking-wider">
                <Plus className="w-3 h-3" /> Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => {
                const selectedProduct = products?.find((p: any) => p.id === item.productId);
                const totalStock = selectedProduct?.inventory?.reduce((acc: number, i: any) => acc + i.quantity, 0) || 0;

                return (
                  <div key={index} className="flex gap-3 items-start group bg-background p-3 rounded-2xl border border-border shadow-sm">
                    <div className="flex-1 space-y-1.5">
                      <Select 
                        value={item.productId} 
                        onValueChange={(val) => updateItem(index, 'productId', val)}
                      >
                        <SelectTrigger className="rounded-xl h-11 border-none bg-muted/60 dark:bg-muted/40 font-semibold">
                          <SelectValue placeholder="Select Product" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                          {products?.map((p: any) => (
                            <SelectItem key={p.id} value={p.id} className="rounded-xl py-3">
                              <div className="flex items-center justify-between w-full gap-2">
                                <span className="font-bold">{p.name}</span>
                                <Badge variant="outline" className="text-[9px] h-4 font-black">SKU: {p.sku}</Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {item.productId && (
                        <p className="text-[10px] font-black text-slate-400 pl-1 uppercase tracking-widest">
                          Stock: <span className={totalStock > 0 ? "text-emerald-600" : "text-rose-600"}>{totalStock} units</span>
                        </p>
                      )}
                    </div>
                    
                    <div className="w-24">
                      <Input
                        type="number"
                        min="1"
                        max={totalStock}
                        placeholder="Qty"
                        className="rounded-xl h-11 border-none bg-muted/60 dark:bg-muted/40 font-black text-center"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                      />
                    </div>

                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      className="h-11 w-11 rounded-xl text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-bold px-6"
            >
              Discard
            </Button>
            <Button
              type="submit"
              disabled={createOrder.isPending || items.some(i => !i.productId)}
              className="rounded-xl font-black bg-primary px-10 shadow-xl shadow-primary/20 h-12"
            >
              {createOrder.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Confirm Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
