import { useLiveOpsStore, EventCategory } from '@/store/live-ops-store';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Search, Filter, AlertTriangle } from 'lucide-react';

export function EventFilters() {
  const { filters, setFilters } = useLiveOpsStore();

  const toggleCategory = (category: EventCategory) => {
    const isSelected = filters.categories.includes(category);
    if (isSelected) {
      setFilters({ categories: filters.categories.filter(c => c !== category) });
    } else {
      setFilters({ categories: [...filters.categories, category] });
    }
  };

  const categories: { id: EventCategory; label: string; color: string }[] = [
    { id: 'ORDER', label: 'Orders', color: 'bg-blue-500' },
    { id: 'INVENTORY', label: 'Inventory', color: 'bg-emerald-500' },
    { id: 'STAFF', label: 'Staff Tasks', color: 'bg-purple-500' },
    { id: 'RETURN', label: 'Returns', color: 'bg-amber-500' },
    { id: 'SYSTEM', label: 'System', color: 'bg-slate-500' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="w-4 h-4 text-slate-400 mr-2" />
        {categories.map((cat) => {
          const isActive = filters.categories.includes(cat.id);
          return (
            <Badge 
              key={cat.id} 
              variant="outline"
              className={`cursor-pointer transition-all border-none ${isActive ? 'bg-slate-800 text-white shadow-sm' : 'bg-transparent text-slate-500 hover:bg-slate-800/50'}`}
              onClick={() => toggleCategory(cat.id)}
            >
              <span className={`w-2 h-2 rounded-full mr-2 ${isActive ? cat.color : 'bg-slate-700'}`}></span>
              {cat.label}
            </Badge>
          );
        })}
      </div>

      <div className="flex items-center gap-6 w-full md:w-auto">
        <div className="flex items-center gap-2">
          <Switch 
            checked={filters.showOnlyAnomalies} 
            onCheckedChange={(checked) => setFilters({ showOnlyAnomalies: checked })}
            id="anomaly-mode"
          />
          <label htmlFor="anomaly-mode" className="text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer select-none text-slate-400">
            <AlertTriangle className={`w-4 h-4 ${filters.showOnlyAnomalies ? 'text-red-500' : 'text-slate-500'}`} />
            Anomalies Only
          </label>
        </div>

        <div className="relative flex-1 md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Search Order ID, SKU..." 
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="bg-slate-950 border-slate-800 pl-9 text-slate-200 placeholder:text-slate-600 focus-visible:ring-blue-500 h-9"
          />
        </div>
      </div>
    </div>
  );
}
