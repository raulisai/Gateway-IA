'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '@/lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isAuthenticated = authService.isAuthenticated();
    const isAuthPage = pathname?.startsWith('/auth');

    if (!isAuthenticated && !isAuthPage) {
      router.push('/auth/login');
    } else if (isAuthenticated && isAuthPage) {
      router.push('/dashboard');
    }
  }, [pathname, router]);

  return <>{children}</>;
}
