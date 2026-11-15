'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  Package, 
  Palette, 
  Save, 
  Leaf, 
  Sparkles, 
  Gift, 
  Upload, 
  FileText, 
  Info,
  Clock
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  // Packaging Preferences
  const [packagingType, setPackagingType] = useState<'eco' | 'premium' | 'gift'>('eco');
  const [customTape, setCustomTape] = useState(false);
  const [cardInserts, setCardInserts] = useState(true);
  const [fragileTape, setFragileTape] = useState(false);

  // Invoice Template Settings
  const [invoiceTemplate, setInvoiceTemplate] = useState<'classic' | 'modern' | 'minimal'>('modern');
  const [companyName, setCompanyName] = useState('D2C Brand Inc.');
  const [supportEmail, setSupportEmail] = useState('support@d2cbrand.com');
  const [customMemo, setCustomMemo] = useState('Thank you for supporting organic fashion. For returns, please contact us within 14 days.');

  // Cutoffs
  const [cutoffHour, setCutoffHour] = useState('14:00');
  const [autoFulfill, setAutoFulfill] = useState(true);

  const handleSaveSettings = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1200)),
      {
        loading: 'Saving brand settings to FCOS warehouse profiles...',
        success: 'Settings applied successfully! Warehouse fulfillment parameters re-cached.',
        error: 'Failed to save settings.',
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Brand Settings</h2>
          <p className="text-muted-foreground font-medium">Customize packaging guidelines, invoice visual templates, and same-day shipment cutoff thresholds.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20" onClick={handleSaveSettings}>
            <Save className="w-4 h-4" /> Save Configurations
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        
        {/* Left Side: Packaging & Operations */}
        <div className="lg:col-span-4 space-y-6">
          {/* Packaging Preferences */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Packaging Guidelines
              </CardTitle>
              <CardDescription className="text-xs">Select the packaging type used by default in FCOS picking & packing lines.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                
                {/* Eco packaging */}
                <div 
                  className={`border rounded-2xl p-4 cursor-pointer flex flex-col items-center justify-between text-center transition-all duration-300 ${
                    packagingType === 'eco' 
                      ? 'border-primary bg-primary/[0.03] dark:bg-primary/[0.015]' 
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-slate-50/20 dark:bg-slate-900/5'
                  }`}
                  onClick={() => setPackagingType('eco')}
                >
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-2xl mb-3">
                    <Leaf className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Eco-Friendly Pack</p>
                    <p className="text-[10px] text-slate-450 dark:text-slate-400">Recyclable kraft box, paper tape, no plastic</p>
                  </div>
                  <Badge variant="outline" className="mt-4 border-emerald-500/20 text-emerald-500 bg-emerald-500/5 font-bold text-[9px]">Standard Fee</Badge>
                </div>

                {/* Premium packaging */}
                <div 
                  className={`border rounded-2xl p-4 cursor-pointer flex flex-col items-center justify-between text-center transition-all duration-300 ${
                    packagingType === 'premium' 
                      ? 'border-primary bg-primary/[0.03] dark:bg-primary/[0.015]' 
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-slate-50/20 dark:bg-slate-900/5'
                  }`}
                  onClick={() => setPackagingType('premium')}
                >
                  <div className="p-2.5 bg-primary/10 text-primary rounded-2xl mb-3">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Custom Premium</p>
                    <p className="text-[10px] text-slate-450 dark:text-slate-400">Luxury rigid box, customized wrap & gold tape</p>
                  </div>
                  <Badge variant="outline" className="mt-4 border-primary/20 text-primary bg-primary/5 font-bold text-[9px]">+$1.50/order</Badge>
                </div>

                {/* Gift packaging */}
                <div 
                  className={`border rounded-2xl p-4 cursor-pointer flex flex-col items-center justify-between text-center transition-all duration-300 ${
                    packagingType === 'gift' 
                      ? 'border-primary bg-primary/[0.03] dark:bg-primary/[0.015]' 
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-slate-50/20 dark:bg-slate-900/5'
                  }`}
                  onClick={() => setPackagingType('gift')}
                >
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-2xl mb-3">
                    <Gift className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Gift Wrapping</p>
                    <p className="text-[10px] text-slate-450 dark:text-slate-400">Silk ribbon tie, handwriting gift note</p>
                  </div>
                  <Badge variant="outline" className="mt-4 border-indigo-500/20 text-indigo-500 bg-indigo-500/5 font-bold text-[9px]">+$2.80/order</Badge>
                </div>
              </div>

              {/* Advanced Packaging Options */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Advanced Options</span>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Custom Brand Tape</p>
                    <p className="text-[10px] text-slate-400">Use vendor custom printed logo packing tape in box assembly</p>
                  </div>
                  <Switch checked={customTape} onCheckedChange={setCustomTape} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Insert Promo Cards</p>
                    <p className="text-[10px] text-slate-400">Place standard custom printed coupon insert inside every order package</p>
                  </div>
                  <Switch checked={cardInserts} onCheckedChange={setCardInserts} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Fragile Caution Wrap</p>
                    <p className="text-[10px] text-slate-400">Wrap boxes with double caution warning tape (Recommended for glassware)</p>
                  </div>
                  <Switch checked={fragileTape} onCheckedChange={setFragileTape} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logistics & cutoffs */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Fulfillment Cutoff & Logic
              </CardTitle>
              <CardDescription className="text-xs">Designate processing cutoff limits for orders incoming from ecommerce webstores.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Same-day Shipping Cutoff</span>
                  <Input 
                    type="time" 
                    value={cutoffHour} 
                    onChange={(e) => setCutoffHour(e.target.value)} 
                    className="h-10 border-slate-200 dark:border-slate-800 bg-transparent text-xs rounded-xl"
                  />
                  <span className="text-[9px] text-slate-400">Orders arriving before this time are guaranteed same-day dispatch.</span>
                </div>

                <div className="flex items-center justify-between self-center p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/10 mt-1">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold">Auto-Fulfill Queue</p>
                    <p className="text-[9px] text-slate-400">Immediately release incoming orders</p>
                  </div>
                  <Switch checked={autoFulfill} onCheckedChange={setAutoFulfill} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Invoice Visual Templates */}
        <Card className="lg:col-span-3 border-none shadow-sm flex flex-col bg-slate-900/40 dark:bg-slate-950/50 backdrop-blur-xl text-slate-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Invoice Customizer
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">Customize the packing slip invoice PDF template inserted in buyer boxes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Invoice Header Logo</span>
              <div className="border border-dashed border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-950/20 text-center">
                <Upload className="w-6 h-6 text-slate-500 mb-2" />
                <p className="text-[10px] text-slate-300 font-bold mb-1">Upload Brand Logo</p>
                <p className="text-[8px] text-slate-500">PNG or JPG under 500kb</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Visual Theme Template</span>
              <div className="grid grid-cols-3 gap-2">
                {['classic', 'modern', 'minimal'].map((t) => (
                  <Button 
                    key={t}
                    type="button"
                    variant={invoiceTemplate === t ? 'default' : 'outline'}
                    className="h-8 rounded-lg text-[10px] uppercase font-bold border-slate-800"
                    onClick={() => setInvoiceTemplate(t as any)}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Company Invoice Display Name</span>
              <Input 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="h-9 border-slate-850 bg-slate-900 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Support Contact Email</span>
              <Input 
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="h-9 border-slate-850 bg-slate-900 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Custom Invoice Memo</span>
              <Textarea 
                value={customMemo}
                onChange={(e) => setCustomMemo(e.target.value)}
                className="border-slate-850 bg-slate-900 text-xs rounded-xl min-h-16"
              />
            </div>

            {/* Mock Invoice slip preview */}
            <div className="pt-2 border-t border-slate-850 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">PDF Slip Preview</span>
              <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/60 flex flex-col gap-2">
                <div className="flex items-center justify-between text-[8px] font-bold pb-2 border-b border-slate-850">
                  <span>{companyName}</span>
                  <span className="text-slate-450">INVOICE #INV-8822</span>
                </div>
                <div className="text-[7px] text-slate-400 space-y-1">
                  <p>Ship to: Alice Smith, New York NY</p>
                  <p>1x Organic Cotton Tee (Black, M) - $28.00</p>
                </div>
                <p className="text-[7px] italic text-slate-400 leading-normal border-t border-slate-850 pt-2">{customMemo}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
