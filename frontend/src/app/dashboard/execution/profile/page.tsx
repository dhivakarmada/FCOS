'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Key, 
  Smartphone, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  Eye, 
  Save, 
  SmartphoneNfc,
  Languages
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";

export default function ProfilePage() {
  const { user } = useAuthStore();
  
  // Settings state
  const [soundVolume, setSoundVolume] = useState(true);
  const [vibrate, setVibrate] = useState(true);
  const [magnifier, setMagnifier] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const handleSaveSettings = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: 'Saving device profiles...',
        success: 'Terminal device configurations saved successfully.',
        error: 'Failed to save configs.',
      }
    );
  };

  return (
    <div className="max-w-md mx-auto pt-2 pb-12 space-y-6 md:max-w-2xl animate-in fade-in">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Profile & Settings</h2>
          <p className="text-xs text-muted-foreground font-medium">Device settings & personal credentials</p>
        </div>
        <Button size="sm" className="h-9 gap-2 rounded-xl shadow-md" onClick={handleSaveSettings}>
          <Save className="w-4 h-4" /> Save
        </Button>
      </div>

      {/* User profile info */}
      <Card className="border-none shadow-sm bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl overflow-hidden">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center font-black text-2xl shadow-lg shadow-primary/20 text-primary-foreground">
            {user?.firstName?.[0] || 'S'}
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-lg leading-none">{user?.firstName || 'FCOS'} {user?.lastName || 'Worker'}</h3>
            <p className="text-xs text-slate-400 font-semibold">{user?.email || 'staff@fcos.com'}</p>
            <div className="flex gap-2 pt-1">
              <Badge className="bg-primary/20 text-primary border-primary/25 font-bold text-[9px] rounded-full uppercase">
                {user?.role?.replace('_', ' ') || 'STAFF'}
              </Badge>
              <Badge variant="outline" className="border-slate-800 text-slate-400 bg-slate-900/50 font-bold text-[9px]">ID: 8820</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device preferences */}
      <Card className="border-none shadow-sm p-4 space-y-4">
        <span className="text-[10px] font-black uppercase text-slate-400 pl-0.5 tracking-wider block">Scan Haptics & Feedback</span>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-bold">Sound Beep Volume</p>
            <p className="text-[9px] text-slate-400">Audio validation alerts on scans</p>
          </div>
          <div className="flex items-center gap-2">
            {soundVolume ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            <Switch checked={soundVolume} onCheckedChange={setSoundVolume} />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="space-y-0.5">
            <p className="text-xs font-bold">Vibrate on Scan</p>
            <p className="text-[9px] text-slate-400">Trigger haptic buzz on laser capture</p>
          </div>
          <Switch checked={vibrate} onCheckedChange={setVibrate} />
        </div>
      </Card>

      {/* Accessibility options */}
      <Card className="border-none shadow-sm p-4 space-y-4">
        <span className="text-[10px] font-black uppercase text-slate-400 pl-0.5 tracking-wider block">Terminal Accessibility</span>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-bold">Viewport Zoom Magnifier</p>
            <p className="text-[9px] text-slate-400">Zoom in on bin and barcode list texts</p>
          </div>
          <Switch checked={magnifier} onCheckedChange={setMagnifier} />
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="space-y-0.5">
            <p className="text-xs font-bold">Large Font Scale</p>
            <p className="text-[9px] text-slate-400">Increase base text size for handheld screens</p>
          </div>
          <Switch checked={largeText} onCheckedChange={setLargeText} />
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="space-y-0.5">
            <p className="text-xs font-bold">Language Translation</p>
            <p className="text-[9px] text-slate-400">Translate dashboard actions and instructions</p>
          </div>
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-slate-400" />
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-xs font-bold rounded border-none focus:ring-0 outline-none text-slate-600 dark:text-slate-300"
            >
              <option value="en">English (US)</option>
              <option value="es">Español (ES)</option>
              <option value="fr">Français (FR)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Security credentials */}
      <Card className="border-none shadow-sm p-4 space-y-4">
        <span className="text-[10px] font-black uppercase text-slate-400 pl-0.5 tracking-wider block">Security Credentials</span>
        
        <div className="space-y-3">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 block">Current Password</span>
            <Input type="password" placeholder="••••••••" className="h-10 rounded-xl text-xs" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 block">New Password</span>
            <Input type="password" placeholder="Enter new password..." className="h-10 rounded-xl text-xs" />
          </div>

          <Button variant="outline" className="w-full h-10 rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs" onClick={() => toast.success("Password reset request submitted.")}>
            Change Shift Password
          </Button>
        </div>
      </Card>
    </div>
  );
}
