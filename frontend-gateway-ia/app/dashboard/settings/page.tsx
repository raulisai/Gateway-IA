'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Configuración</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Gestiona tu cuenta y preferencias
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Perfil</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Información de tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-sm text-muted-foreground">
            Configuración próximamente
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
