/**
 * Hooks personnalisés pour l'authentification avec Zustand
 */

import { useAuthStore, authSelectors } from '@/lib/store';

/**
 * Hook pour accéder à l'utilisateur connecté
 */
export function useUser() {
  return useAuthStore(authSelectors.getUser);
}

/**
 * Hook pour accéder au type d'utilisateur
 */
export function useUserType() {
  return useAuthStore(authSelectors.getUserType);
}

/**
 * Hook pour vérifier si l'utilisateur est authentifié
 */
export function useIsAuthenticated() {
  return useAuthStore(authSelectors.isAuthenticated);
}

/**
 * Hook pour vérifier si l'utilisateur est un admin
 */
export function useIsAdmin() {
  return useAuthStore(authSelectors.isAdmin);
}

/**
 * Hook pour vérifier si l'utilisateur est un employé
 */
export function useIsEmployee() {
  return useAuthStore(authSelectors.isEmployee);
}

/**
 * Hook pour accéder à l'email de l'utilisateur
 */
export function useUserEmail() {
  return useAuthStore(authSelectors.getEmail);
}

/**
 * Hook pour accéder au nom complet de l'utilisateur
 */
export function useUserFullName() {
  return useAuthStore(authSelectors.getFullName);
}

/**
 * Hook pour accéder à toutes les actions d'authentification
 */
export function useAuthActions() {
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  return {
    setUser,
    clearUser,
    setLoading,
  };
}

/**
 * Hook complet pour l'authentification
 */
export function useAuth() {
  const user = useUser();
  const userType = useUserType();
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();
  const isEmployee = useIsEmployee();
  const email = useUserEmail();
  const fullName = useUserFullName();
  const isLoading = useAuthStore((state) => state.isLoading);
  const actions = useAuthActions();

  return {
    user,
    userType,
    isAuthenticated,
    isAdmin,
    isEmployee,
    email,
    fullName,
    isLoading,
    ...actions,
  };
}
