/**
 * Layout pour le dashboard
 */

'use client';

import React from 'react';
import type { AdminUser } from '@/lib/types/core';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui';
import { HiOutlineArrowRightOnRectangle } from 'react-icons/hi2';
import { authService } from '@/lib/services/core';
import { useRouter } from 'next/navigation';
import { siteConfig } from '@/lib/config';

export interface DashboardLayoutProps {
  user: AdminUser | null;
  children: React.ReactNode;
}

export function DashboardLayout({ user, children }: DashboardLayoutProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await authService.logout();
    router.push(siteConfig.core.auth.login);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
              {user && (
                <p className="text-sm text-muted-foreground mt-1">
                  Bienvenue, {user.first_name} {user.last_name}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <HiOutlineArrowRightOnRectangle className="size-4" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
