'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Key, Activity, Users, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    {
      title: 'Total API Keys',
      value: '0',
      description: 'Keys activas',
      icon: Key,
    },
    {
      title: 'Requests Hoy',
      value: '0',
      description: 'Peticiones realizadas',
      icon: Activity,
    },
    {
      title: 'Proveedores',
      value: '0',
      description: 'Configurados',
      icon: Users,
    },
    {
      title: 'Éxito Rate',
      value: '0%',
      description: 'Últimas 24h',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Bienvenido a tu panel de control de Gateway IA
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium sm:text-sm">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold sm:text-2xl">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Actividad Reciente</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Últimas peticiones a tu API Gateway
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center text-sm text-muted-foreground">
              No hay actividad reciente
            </div>
          </CardContent>
        </Card>

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
