'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient, type RequestLog } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

export function RecentRequests() {
  const { isAuthenticated } = useAuth();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['analytics', 'recent-requests'],
    queryFn: () => apiClient.analytics.recentRequests(10),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const formatCost = (cost: number) => {
    if (cost < 0.01) return `$${cost.toFixed(6)}`;
    return `$${cost.toFixed(4)}`;
  };

  const formatLatency = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    
    return date.toLocaleDateString('es-ES', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card className="md:col-span-2 lg:col-span-7">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Requests Recientes</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Últimas peticiones procesadas por el gateway
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-muted"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <Card className="md:col-span-2 lg:col-span-7">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Requests Recientes</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Últimas peticiones procesadas por el gateway
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-sm text-muted-foreground">
            No hay requests recientes
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="md:col-span-2 lg:col-span-7">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Requests Recientes</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Últimas {requests.length} peticiones procesadas por el gateway
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between rounded-lg border p-3 text-sm"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{request.model_used}</span>
                  <span className="text-xs text-muted-foreground">
                    ({request.provider})
                  </span>
                  {request.cached && (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
                      Cached
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    {request.input_tokens + request.output_tokens} tokens
                  </span>
                  <span>•</span>
                  <span>{formatLatency(request.latency_ms)}</span>
                  <span>•</span>
                  <span className="capitalize">{request.complexity}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-semibold">{formatCost(request.cost)}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(request.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
