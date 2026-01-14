'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Activity, Zap, TrendingUp, Hash } from 'lucide-react';
import { MetricsCard } from '@/components/dashboard/metrics-card';
import { CostChart } from '@/components/dashboard/cost-chart';
import { ModelDistributionChart } from '@/components/dashboard/model-distribution-chart';
import { RecentRequests } from '@/components/dashboard/recent-requests';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();

  // Fetch analytics overview
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => apiClient.analytics.overview(1), // 1 day
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch cost breakdown
  const { data: costBreakdown, isLoading: costLoading } = useQuery({
    queryKey: ['analytics', 'cost-breakdown'],
    queryFn: () => apiClient.analytics.costBreakdown(7),
    enabled: isAuthenticated,
  });

  // Fetch model distribution
  const { data: modelDistribution, isLoading: distributionLoading } = useQuery({
    queryKey: ['analytics', 'model-distribution'],
    queryFn: () => apiClient.analytics.modelDistribution(7),
    enabled: isAuthenticated,
  });

  const formatCost = (cost: number) => {
    if (cost === 0) return '$0.00';
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(2)}`;
  };

  const formatLatency = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Vista general de tu Gateway LLM
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Costo Total (24h)"
          value={overview ? formatCost(overview.total_cost) : '$0.00'}
          description="Gasto en LLMs"
          icon={DollarSign}
          loading={overviewLoading}
        />
        <MetricsCard
          title="Total Requests"
          value={overview?.total_requests || 0}
          description="Últimas 24 horas"
          icon={Activity}
          loading={overviewLoading}
        />
        <MetricsCard
          title="Total Tokens"
          value={overview?.total_tokens.toLocaleString() || 0}
          description="Tokens procesados"
          icon={Hash}
          loading={overviewLoading}
        />
        <MetricsCard
          title="Latencia Promedio"
          value={overview ? formatLatency(overview.avg_latency) : '0ms'}
          description="Tiempo de respuesta"
          icon={Zap}
          loading={overviewLoading}
        />
      </div>

      {/* Additional Metrics Row */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        <MetricsCard
          title="Cache Hit Rate"
          value={overview ? `${(overview.cache_hit_rate * 100).toFixed(1)}%` : '0%'}
          description="Respuestas en caché"
          icon={TrendingUp}
          loading={overviewLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <CostChart 
          data={costBreakdown || []} 
          loading={costLoading}
        />
        <ModelDistributionChart 
          data={modelDistribution || []} 
          loading={distributionLoading}
        />
      </div>

      {/* Recent Requests */}
      <RecentRequests />

      {/* Additional Info */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Inicio Rápido</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Empieza a usar tu Gateway
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="space-y-1 sm:space-y-2">
              <h4 className="text-xs font-semibold sm:text-sm">1. Configura tus Provider Keys</h4>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Añade las API keys de OpenAI, Anthropic, etc.
              </p>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <h4 className="text-xs font-semibold sm:text-sm">2. Crea un Gateway Key</h4>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Genera una key para usar en tus aplicaciones
              </p>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <h4 className="text-xs font-semibold sm:text-sm">3. Empieza a usar la API</h4>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Realiza peticiones a través del Gateway
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
