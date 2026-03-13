'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { moduleService } from '@/lib/services/core';

interface ModuleContextType {
  activeModules: string[];
  organizationId: string | null;
  organizationName: string | null;
  loading: boolean;
  isModuleActive: (moduleCode: string) => boolean;
  refreshModules: () => Promise<void>;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

interface ModuleProviderProps {
  children: ReactNode;
}

export function ModuleProvider({ children }: ModuleProviderProps) {
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  // Extraire le subdomain de l'URL (format: /apps/{slug}/...)
  const getOrganizationSubdomain = (): string | undefined => {
    if (pathname && pathname.startsWith('/apps/')) {
      const parts = pathname.split('/');
      if (parts.length >= 3) {
        return parts[2]; // /apps/{slug}/...
      }
    }
    return undefined;
  };

  const loadActiveModules = async () => {
    try {
      setLoading(true);
      const subdomain = getOrganizationSubdomain();
      console.log('🔧 ModuleContext: Chargement des modules actifs...', { subdomain });
      const response = await moduleService.getActiveForUser(subdomain);
      console.log('✅ ModuleContext: Modules reçus', {
        modules: response.active_modules,
        count: response.active_modules?.length || 0,
        org: response.organization_name
      });
      setActiveModules(response.active_modules);
      setOrganizationId(response.organization_id);
      setOrganizationName(response.organization_name);
    } catch (error) {
      console.error('❌ ModuleContext: Erreur lors du chargement des modules actifs:', error);
      // En cas d'erreur, on laisse un tableau vide (pas de modules actifs)
      setActiveModules([]);
    } finally {
      setLoading(false);
      console.log('🔧 ModuleContext: Chargement terminé, loading=false');
    }
  };

  useEffect(() => {
    loadActiveModules();
  }, [pathname]);

  const isModuleActive = (moduleCode: string): boolean => {
    return activeModules.includes(moduleCode);
  };

  const refreshModules = async () => {
    await loadActiveModules();
  };

  return (
    <ModuleContext.Provider
      value={{
        activeModules,
        organizationId,
        organizationName,
        loading,
        isModuleActive,
        refreshModules,
      }}
    >
      {children}
    </ModuleContext.Provider>
  );
}

export function useModules() {
  const context = useContext(ModuleContext);
  if (context === undefined) {
    throw new Error('useModules must be used within a ModuleProvider');
  }
  return context;
}
