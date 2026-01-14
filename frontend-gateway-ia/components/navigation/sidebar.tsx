'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Key,
  Settings,
  LogOut,
  Menu,
  Boxes,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useState } from 'react';
import { authService } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const routes = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    label: 'API Keys',
    icon: Key,
    href: '/dashboard/keys',
  },
  {
    label: 'Models',
    icon: Boxes,
    href: '/dashboard/models',
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/dashboard/settings',
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await authService.logout();
    router.push('/auth/login');
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col space-y-4 py-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-base font-semibold tracking-tight sm:text-lg">
          Gateway IA
        </h2>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              onClick={() => setOpen(false)}
            >
              <Button
                variant={pathname === route.href ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start text-sm',
                  pathname === route.href && 'bg-muted'
                )}
              >
                <route.icon className="mr-2 h-4 w-4" />
                {route.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>
      <div className="mt-auto px-3 py-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-sm"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="fixed inset-y-0 z-50 hidden w-64 md:flex md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r bg-card">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="outline" size="icon" className="fixed left-4 top-4 z-40">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
