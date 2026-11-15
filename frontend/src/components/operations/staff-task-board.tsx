import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Activity } from 'lucide-react';

export function StaffTaskBoard() {
  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff-performance'],
    queryFn: async () => {
      const { data } = await api.get('/staff/performance/all');
      return data;
    }
  });

  return (
    <Card className="border-none shadow-sm rounded-3xl overflow-hidden h-full">
      <CardHeader className="bg-slate-50 border-b border-slate-100 p-4">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Active Workforce
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-4">
            <div className="h-12 bg-slate-100 animate-pulse rounded-xl" />
            <div className="h-12 bg-slate-100 animate-pulse rounded-xl" />
          </div>
        ) : (
          <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto">
            {staff?.slice(0, 5).map((member: any) => (
              <div key={member.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {member.firstName?.[0]}{member.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{member.firstName} {member.lastName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                      <Activity className="w-3 h-3 text-emerald-500" /> {member.tasksCompleted} tasks done
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-none shrink-0">
                  Score: {member.performanceScore}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
