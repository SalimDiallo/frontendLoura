/**
 * Guard composant pour vérifier l'accès d'un utilisateur à une organisation.
 * Gère l'authentification, la logique d'autorisation, et fournit un UX/feedback amélioré.
 */

'use client';

import { useEffect, useState, useCallback, PropsWithChildren } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/core';
import { employeeAuthService } from '@/lib/services/hr';
import { apiClient, tokenManager } from '@/lib/api/client';
import type { Organization } from '@/lib/types/core';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { HiOutlineLockClosed } from 'react-icons/hi2';

interface OrgAccessGuardProps extends PropsWithChildren {
  organizationSlug: string;
}

/**
 * Vérifie que l'utilisateur est authentifié et a accès à l'organisation
 */
export function OrgAccessGuard({ children, organizationSlug }: OrgAccessGuardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Meilleure gestion du montage côté client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // UseCallback pour éviter la recréation de la fonction à chaque render
  const checkAccess = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Récupérer le user dans le token (global, employee ou admin)
      const storedUser = tokenManager.getUser();
      console.log(storedUser);
      

      if (!storedUser) {
        // Not authenticated (redirect employee as default)
        router.replace(`/auth/employee?redirect=/apps/${organizationSlug}/dashboard`);
        return;
      }

      const userType = storedUser.userType || 'admin';
      // Empêcher case mismatch
      const slug = organizationSlug.toLowerCase();

      if (userType === 'employee') {
        const employee = employeeAuthService.getStoredEmployee();
        if (!employee) {
          employeeAuthService.logout();
          router.replace(`/auth/employee?redirect=/apps/${organizationSlug}/dashboard`);
          return;
        }

        // L'employé appartient bien à l'orga ?
        if (!employee.organization_subdomain || employee.organization_subdomain.toLowerCase() !== slug) {
          setError("Vous n'avez pas accès à cette organisation.");
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        // Employé désactivé ?
        if (!employee.is_active) {
          employeeAuthService.logout();
          router.replace(`/auth/employee?message=${encodeURIComponent("Votre compte a été désactivé. Veuillez contacter votre administrateur.")}`);
          return;
        }

        // ✅ Accès validé pour l'employé - RETURN ICI
        setHasAccess(true);
        setIsLoading(false);
        return; // Important : ne pas continuer vers le code admin
      }

      // Admin user case - seulement si on n'est PAS un employé
      const adminUser = authService.getStoredUser();
      if (!adminUser) {
        router.replace(`/auth/admin?redirect=/apps/${organizationSlug}/dashboard`);
        return;
      }

      // Optimisation : n'appelle l'API que si nécessaire
      const response = await apiClient.get<{ count: number; results: Organization[] }>('/core/organizations/');
      const organizations = response?.results ?? [];
      const org = organizations.find(
        (o) => o.subdomain?.toLowerCase() === slug
      );
      if (!org) {
        setError("Vous n'avez pas accès à cette organisation.");
        setHasAccess(false);
        setIsLoading(false);
        return;
      }
      if (!org.is_active) {
        router.replace(
          `/core/dashboard?message=${encodeURIComponent(
            "Cette organisation est désactivée. Vous pouvez la réactiver depuis les paramètres."
          )}`
        );
        return;
      }

      setHasAccess(true);
      setIsLoading(false);
    } catch (err) {
      // Handler robuste
      // Peut être Error classique ou un objet du client fetch
      let msg = "Erreur lors de la vérification de l'accès à l'organisation.";
      if (err instanceof Error) {
        msg = err.message;
        // Spécifique pour le token expiré, laisse le client gérer la redirection
        if (msg.includes('Session expirée') || msg.toLowerCase().includes('expired')) {
          return;
        }
      }

      // Optionnel : déconnexion employé si erreur d'accès
      const storedUser = tokenManager.getUser();
      if (storedUser?.userType === 'employee') {
        employeeAuthService.logout();
        router.replace(
          `/auth/employee?message=${encodeURIComponent("Erreur lors de la vérification de l'accès. Veuillez vous reconnecter.")}`
        );
        return;
      }

      setError(msg);
      setHasAccess(false);
      setIsLoading(false);
    }
  }, [organizationSlug, router]);

  useEffect(() => {
    if (isMounted) {
      checkAccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, checkAccess]);

  // Protection du SSR
  if (!isMounted) return null;

  // Loader d'accès
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">Vérification de l'accès à l'organisation…</p>
        </div>
      </div>
    );
  }

  // Message d'accès refusé (plus pédagogique)
  if (!hasAccess) {
    const storedUser = tokenManager.getUser();
    const isEmployee = storedUser?.userType === 'employee';

    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full">
          <Alert variant="error" title="Accès refusé">
            <div>
              {error || "Vous n'avez pas accès à cette organisation."}
            </div>
            <div className="mt-4 flex gap-2">
              {!isEmployee && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/core/dashboard')}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Retour au dashboard
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(isEmployee ? '/auth/employee' : '/auth/admin')}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Se reconnecter
              </Button>
            </div>
          </Alert>

          {/* Message d'aide amélioré */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex gap-2 items-start">
              <HiOutlineLockClosed className="size-5 text-muted-foreground mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">Pourquoi ne puis-je pas accéder&nbsp;?</p>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Vous n'êtes pas membre de cette organisation.</li>
                  <li>L'organisation est désactivée.</li>
                  <li>Votre session a expiré&nbsp;: reconnectez-vous.</li>
                </ul>
                <p className="mt-2">
                  Besoin d'aide&nbsp;? Contactez un administrateur ou&nbsp;<a href="mailto:support@loura.app" className="underline text-primary">le support</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Accès validé
  return <>{children}</>;
}
