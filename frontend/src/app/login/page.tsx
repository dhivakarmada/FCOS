'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertCircle, Building2, Loader2, Lock, Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { setAuth, isAuthenticated, _hasHydrated, user: currentUser } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated && isAuthenticated && currentUser) {
      // Redirect based on role
      switch (currentUser.role) {
        case 'SUPER_ADMIN':
          router.push('/dashboard/super-admin');
          break;
        case 'VENDOR_ADMIN':
          router.push('/dashboard');
          break;
        case 'WAREHOUSE_MANAGER':
          router.push('/dashboard/warehouse');
          break;
        case 'STAFF':
          router.push('/dashboard/execution');
          break;
        default:
          router.push('/dashboard');
      }
    }
  }, [_hasHydrated, isAuthenticated, currentUser, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { user, access_token, refresh_token } = data;

      setAuth(user, access_token, refresh_token);
      toast.success(`Welcome back, ${user.firstName}!`);

      // Redirect based on role
      switch (user.role) {
        case 'SUPER_ADMIN':
          router.push('/dashboard/super-admin');
          break;
        case 'VENDOR_ADMIN':
          router.push('/dashboard');
          break;
        case 'WAREHOUSE_MANAGER':
          router.push('/dashboard/warehouse');
          break;
        case 'STAFF':
          router.push('/dashboard/execution');
          break;
        default:
          router.push('/dashboard');
      }
    } catch (err: any) {
      if (!err.response) {
        setError('Cannot connect to backend server at http://localhost:4000. Please ensure the backend is running.');
      } else {
        setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <Card className="w-full max-w-md border-none shadow-2xl rounded-3xl overflow-hidden relative z-10 bg-white dark:bg-slate-900 ring-0">
        <CardHeader className="space-y-1 pb-8 text-center bg-slate-900 text-white rounded-none border-b-0">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-white">Fulfillment Center OS</CardTitle>
          <CardDescription className="text-slate-400 font-medium">Enter your credentials to access your dashboard</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <Alert variant="destructive" className="rounded-2xl border-none bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-bold text-xs">{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input 
                id="email" 
                type="email" 
                placeholder="name@company.com" 
                required 
                className="pl-11 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary transition-all font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-slate-500">Password</Label>
              <a href="#" className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">Forgot password?</a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input 
                id="password" 
                type="password" 
                required 
                className="pl-11 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary transition-all font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full h-12 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all cursor-pointer"
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'SIGN IN TO DASHBOARD'}
            </Button>
          </div>
        </form>
      </Card>
      
      <div className="absolute bottom-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 z-10">
        Enterprise Logistics Protocol v2.4.0
      </div>
    </div>
  );
}
