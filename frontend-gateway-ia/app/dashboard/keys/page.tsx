'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function KeysPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">API Keys</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Gestiona tus Gateway Keys y Provider Keys
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Gateway Keys</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Keys para usar en tus aplicaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center text-sm text-muted-foreground">
              No hay gateway keys configuradas
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Provider Keys</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Keys de proveedores externos (OpenAI, Anthropic, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center text-sm text-muted-foreground">
              No hay provider keys configuradas
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
