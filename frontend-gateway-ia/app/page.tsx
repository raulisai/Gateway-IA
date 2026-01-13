import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Shield, BarChart } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-lg font-bold sm:text-xl">Gateway IA</span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="sm:size-default">Iniciar Sesión</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="sm:size-default">Comenzar</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="w-full py-12 sm:py-16 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-[1000px] flex-col items-center text-center">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                Gestiona tus APIs de IA en un solo lugar
              </h1>
              <p className="mt-4 text-base leading-7 text-muted-foreground sm:mt-6 sm:text-lg sm:leading-8 md:max-w-3xl">
                Gateway IA te permite centralizar, monitorear y controlar el acceso a múltiples
                proveedores de IA como OpenAI, Anthropic, Google y más.
              </p>
              <div className="mt-8 flex w-full flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:justify-center sm:gap-4">
                <Link href="/auth/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full gap-2 sm:w-auto">
                    Comenzar Gratis
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth/login" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Iniciar Sesión
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full border-t bg-muted/50 py-12 sm:py-16 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1200px]">
              <h2 className="mb-8 text-center text-2xl font-bold tracking-tight sm:mb-12 sm:text-3xl md:text-4xl">
                Características principales
              </h2>
              <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
                <div className="flex flex-col items-center rounded-lg bg-background p-6 text-center shadow-sm">
                  <div className="mb-4 rounded-full bg-primary/10 p-3">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold sm:text-xl">Seguridad</h3>
                  <p className="text-sm text-muted-foreground sm:text-base">
                    Control de acceso, autenticación y gestión segura de API keys
                  </p>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-background p-6 text-center shadow-sm">
                  <div className="mb-4 rounded-full bg-primary/10 p-3">
                    <BarChart className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold sm:text-xl">Monitoreo</h3>
                  <p className="text-sm text-muted-foreground sm:text-base">
                    Estadísticas en tiempo real y logs de todas tus peticiones
                  </p>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-background p-6 text-center shadow-sm">
                  <div className="mb-4 rounded-full bg-primary/10 p-3">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold sm:text-xl">Multi-Proveedor</h3>
                  <p className="text-sm text-muted-foreground sm:text-base">
                    Integración con OpenAI, Anthropic, Google y más proveedores
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t py-6 md:py-8">
        <div className="container mx-auto flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-muted-foreground sm:text-sm">
            © 2026 Gateway IA. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
