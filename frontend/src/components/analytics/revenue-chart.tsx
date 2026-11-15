import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAnalyticsStore } from '@/store/analytics-store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  data: any;
  isLoading: boolean;
}

export function RevenueChart({ data, isLoading }: Props) {
  const { period, setPeriod } = useAnalyticsStore();

  if (isLoading || !data) {
    return <div className="h-[400px] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl" />;
  }

  // Format dates based on period
  const chartData = data.breakdown?.map((item: any) => {
    const d = new Date(item.date);
    let formattedDate = item.date;
    if (period === 'daily') formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (period === 'weekly') formattedDate = `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    if (period === 'monthly') formattedDate = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    return {
      ...item,
      formattedDate,
      revenue: Number(item.revenue),
    };
  }) || [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-slate-800">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
          <p className="text-xl font-black text-emerald-400">
            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(payload[0].value)}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Orders: <span className="font-bold text-white">{payload[0].payload.count}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-none shadow-md rounded-3xl overflow-hidden bg-white dark:bg-slate-900 col-span-1 lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Revenue Trends</CardTitle>
        <Select value={period} onValueChange={(val: any) => setPeriod(val)}>
          <SelectTrigger className="w-[120px] h-8 rounded-full bg-slate-100 dark:bg-slate-800 border-none font-bold text-xs">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-none shadow-xl">
            <SelectItem value="daily" className="font-medium rounded-xl cursor-pointer">Daily (30d)</SelectItem>
            <SelectItem value="weekly" className="font-medium rounded-xl cursor-pointer">Weekly (90d)</SelectItem>
            <SelectItem value="monthly" className="font-medium rounded-xl cursor-pointer">Monthly (1yr)</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis 
                dataKey="formattedDate" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#64748b' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '3 3' }} />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
