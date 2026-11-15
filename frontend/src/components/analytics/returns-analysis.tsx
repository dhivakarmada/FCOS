import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface Props {
  data: any;
  isLoading: boolean;
}

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#64748b'];

export function ReturnsAnalysis({ data, isLoading }: Props) {
  if (isLoading || !data) {
    return <div className="h-[400px] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl" />;
  }

  const chartData = data.topReasons?.map((item: any) => ({
    name: item.reason,
    value: item.count,
  })) || [];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-sm">
          <p className="font-bold text-slate-300">{payload[0].name}</p>
          <p className="text-xl font-black mt-1" style={{ color: payload[0].payload.fill }}>
            {payload[0].value} <span className="text-xs font-medium text-slate-500">returns</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-none shadow-md rounded-3xl overflow-hidden bg-white dark:bg-slate-900 col-span-1">
      <CardHeader className="pb-0">
        <CardTitle className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center justify-between">
          Returns Breakdown
          <span className="text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-lg text-xs tracking-widest uppercase">
            {data.returnRate}% RTO
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[280px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                formatter={(value) => <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="px-6 pb-6 pt-2 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Value Refunded</p>
          <p className="text-xl font-black text-rose-500">
            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(data.refundedAmount || 0)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
