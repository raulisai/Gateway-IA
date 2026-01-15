'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const signupSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string(),
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { signup } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      full_name: '',
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    setErrorHeader(null);
    try {
      await signup(data.email, data.password, data.full_name);
      toast({
        title: '¡Bienvenido!',
        description: 'Tu cuenta ha sido creada con éxito. Redirigiendo...',
      });
    } catch (error: any) {
      setErrorHeader(error.message || 'Error al crear la cuenta');
      toast({
        title: 'Error en el Registro',
        description: error.message || 'No pudimos crear tu cuenta. Revisa los datos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordValue = form.watch('password') || '';

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background overflow-hidden p-4">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 -right-4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -left-4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl relative z-10 transition-all duration-300 hover:shadow-primary/5">
        <CardHeader className="space-y-1.5 px-6 pt-8 pb-4">
          <CardTitle className="text-2xl font-bold tracking-tight text-center">Crea tu Cuenta</CardTitle>
          <CardDescription className="text-sm text-center text-muted-foreground">
            Únete a la plataforma de IA Gateway más avanzada
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-4">
          {errorHeader && (
            <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                {errorHeader}
              </div>
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre Completo</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Juan Pérez"
                          className="bg-background/50 border-border/80 h-11"
                          autoComplete="name"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="tu@ejemplo.com"
                          className="bg-background/50 border-border/80 h-11"
                          disabled={isLoading}
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contraseña</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="bg-background/50 border-border/80 h-11"
                        autoComplete="new-password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Seguridad de la cuenta:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <RequirementItem met={passwordValue.length >= 8} label="8+ caracteres" />
                        <RequirementItem met={/[A-Z]/.test(passwordValue)} label="Mayúscula" />
                        <RequirementItem met={/[a-z]/.test(passwordValue)} label="Minúscula" />
                        <RequirementItem met={/[0-9]/.test(passwordValue)} label="Número" />
                      </div>
                    </div>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirmar Contraseña</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        className="bg-background/50 border-border/80 h-11"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-11 text-base font-semibold mt-2 transition-all hover:scale-[1.01] active:scale-[0.99]" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>Creando cuenta...</span>
                  </div>
                ) : 'Registrarse'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 px-6 pb-8 pt-2">
          <div className="text-center text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/auth/login" className="text-primary font-bold hover:underline transition-all">
              Inicia sesión
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

function RequirementItem({ met, label }: { met: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 transition-colors duration-300 ${met ? 'text-green-500' : 'text-muted-foreground/60'}`}>
      <div className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${met ? 'bg-green-500 scale-125' : 'bg-muted-foreground/30'}`} />
      <span className="text-[10px] font-medium">{label}</span>
    </div>
  );
}
