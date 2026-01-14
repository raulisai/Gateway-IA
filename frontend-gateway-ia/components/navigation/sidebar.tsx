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

import { useTheme } from "next-themes";
import {
  Moon,
  Sun,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { setTheme, theme } = useTheme();
  const [transitionStatus, setTransitionStatus] = useState<"idle" | "to-dark" | "to-light">("idle");

  const handleLogout = async () => {
    await authService.logout();
    router.push('/auth/login');
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTransitionStatus(nextTheme === "dark" ? "to-dark" : "to-light");

    // Switch theme exactly when the wipe covers the screen
    setTimeout(() => {
      setTheme(nextTheme);
    }, 400);

    // End transition
    setTimeout(() => {
      setTransitionStatus("idle");
    }, 850);
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col space-y-4 py-4">
      {transitionStatus !== "idle" && (
        <div className={cn(
          "theme-transition-overlay",
          transitionStatus === "to-dark" ? "dark-wipe" : "light-wipe"
        )} />
      )}
      {transitionStatus === "to-light" && (
        <div className="sunburst-effect" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
      )}
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-base font-semibold tracking-tight sm:text-lg bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
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
                  'w-full justify-start text-sm transition-all duration-200',
                  pathname === route.href && 'bg-muted shadow-sm'
                )}
              >
                <route.icon className={cn(
                  "mr-2 h-4 w-4",
                  pathname === route.href ? "text-primary" : "text-muted-foreground"
                )} />
                {route.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>
      <div className="mt-auto px-3 py-2 space-y-3">
        <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Appearance
        </div>
        <Button
          variant="outline"
          className="w-full justify-between text-sm theme-toggle-btn border-dashed hover:border-solid group overflow-visible"
          onClick={toggleTheme}
        >
          <div className="flex items-center">
            <div className="relative h-4 w-4 mr-2">
              <Sun className="h-4 w-4 absolute transition-all dark:rotate-90 dark:scale-0 rotate-0 scale-100 text-yellow-500" />
              <Moon className="h-4 w-4 absolute transition-all dark:rotate-0 dark:scale-100 rotate-90 scale-0 text-blue-400" />
            </div>
            <span>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
          </div>
          <div className={cn(
            "h-2 w-2 rounded-full transition-all duration-500",
            theme === "dark" ? "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" : "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]"
          )} />
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-sm hover:bg-destructive/10 hover:text-destructive transition-colors"
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
