/**
 * Context Provider pour les permissions au niveau de l'organisation
 * Version simplifiée utilisant directement les codes du backend
 */

'use client';

import { createContext, useContext, useEffect, useState, PropsWithChildren, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuthStore, usePermissionsStore } from '@/lib/store';
import { normalizePermissionCode } from '@/lib/constants/permissions';

// ============================================
// Types
// ============================================

export interface PermissionContextValue {
  /** ID de l'utilisateur connecté */
  userId: string | null;
  /** Slug de l'organisation courante */
  organizationId: string | null;
  /** Liste des codes de permissions de l'utilisateur */
  permissions: string[];
  /** L'utilisateur est-il un admin ? (toutes permissions) */
  isAdmin: boolean;
  /** Chargement en cours */
  isLoading: boolean;
  /** Message d'erreur éventuel */
  error: string | null;
  /** Vérifie si l'utilisateur a une permission spécifique */
  hasPermission: (code: string) => boolean;
  /** Vérifie si l'utilisateur a au moins une des permissions (OR) */
  hasAnyPermission: (codes: string[]) => boolean;
  /** Vérifie si l'utilisateur a toutes les permissions (AND) */
  hasAllPermissions: (codes: string[]) => boolean;
  /** Rafraîchir les permissions */
  refetch: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextValue | undefined>(undefined);

// ============================================
// Provider
// ============================================

interface PermissionProviderProps extends PropsWithChildren {
  organizationSlug?: string;
}

/**
 * Provider pour les permissions de l'organisation
 * À placer dans le layout de l'organisation
 */
export function PermissionProvider({ children, organizationSlug: propSlug }: PermissionProviderProps) {
  const params = useParams();
  const slug = propSlug || (params?.slug as string);

  const [userId, setUserId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  /**
   * Charge les permissions de l'utilisateur
   */
  const fetchPermissions = useCallback(async () => {
    if (!slug) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Récupérer l'utilisateur depuis le store Zustand
      const user = useAuthStore.getState().user;
      const userType = useAuthStore.getState().userType;

      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      setUserId(user.id);

      if (userType === 'admin') {
        // AdminUser = toutes les permissions
        setIsAdmin(true);
        setPermissions([]);  // Pas besoin de stocker, isAdmin = true bypass tout
      } else {
        // Employee = récupérer les permissions du store
        setIsAdmin(false);
        const permissionsFromStore = usePermissionsStore.getState().permissions;
        
        // Extraire les codes et les normaliser
        const permissionCodes = permissionsFromStore.map(p => 
          typeof p === 'string' ? p : p.code
        );
        
        setPermissions(permissionCodes);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des permissions';
      setError(message);
      console.error('Error fetching permissions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  // Montage côté client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Charger les permissions et s'abonner aux changements
  useEffect(() => {
    if (!isMounted) return;

    fetchPermissions();

    // S'abonner aux changements des stores
    const unsubscribeAuth = useAuthStore.subscribe(() => {
      fetchPermissions();
    });

    const unsubscribePermissions = usePermissionsStore.subscribe(() => {
      fetchPermissions();
    });

    return () => {
      unsubscribeAuth();
      unsubscribePermissions();
    };
  }, [isMounted, fetchPermissions]);

  /**
   * Vérifie si l'utilisateur a une permission spécifique
   */
  const hasPermission = useCallback(
    (code: string): boolean => {
      // Admin a toutes les permissions
      if (isAdmin) return true;
      
      // Normaliser le code (support des anciens formats)
      const normalizedCode = normalizePermissionCode(code);
      
      return permissions.includes(normalizedCode);
    },
    [isAdmin, permissions]
  );

  /**
   * Vérifie si l'utilisateur a au moins une des permissions (OR logic)
   */
  const hasAnyPermission = useCallback(
    (codes: string[]): boolean => {
      if (isAdmin) return true;
      return codes.some(code => hasPermission(code));
    },
    [isAdmin, hasPermission]
  );

  /**
   * Vérifie si l'utilisateur a toutes les permissions (AND logic)
   */
  const hasAllPermissions = useCallback(
    (codes: string[]): boolean => {
      if (isAdmin) return true;
      return codes.every(code => hasPermission(code));
    },
    [isAdmin, hasPermission]
  );

  const value: PermissionContextValue = {
    userId,
    organizationId: slug || null,
    permissions,
    isAdmin,
    isLoading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refetch: fetchPermissions,
  };

  // Ne rien rendre côté serveur
  if (!isMounted) {
    return null;
  }

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

/**
 * Hook pour utiliser le contexte des permissions
 */
export function usePermissionContext() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissionContext must be used within a PermissionProvider');
  }
  return context;
}

// ============================================
// Compatibilité avec l'ancien système
// ============================================

/**
 * Convertit une permission backend vers format frontend (compatibilité)
 * @deprecated Utiliser directement les codes backend
 */
export function convertBackendPermissionToFrontend(backendCode: string): string {
  // Retourner tel quel - plus de conversion nécessaire
  return backendCode;
}
