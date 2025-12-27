/**
 * Utilitaires pour la gestion de l'organisation courante
 */

import { tokenManager } from '@/lib/api/client';

/**
 * Récupère l'UUID de l'organisation actuelle depuis le localStorage
 */
export function getCurrentOrganizationId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('current_organization_id');
}

/**
 * Récupère le slug de l'organisation actuelle depuis le localStorage
 */
export function getCurrentOrganizationSlug(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('current_organization_slug');
}

/**
 * Définit l'organisation actuelle
 */
export function setCurrentOrganization(id: string, slug: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('current_organization_id', id);
  localStorage.setItem('current_organization_slug', slug);
}

/**
 * Récupère l'organisation depuis l'utilisateur stocké (pour les employés)
 */
export function getOrganizationFromUser(): { id: string; slug: string } | null {
  const user = tokenManager.getUser();
  if (!user) return null;

  // Pour les employés qui ont organization_id directement
  if (user.organization_id && user.organization_subdomain) {
    return {
      id: user.organization_id,
      slug: user.organization_subdomain,
    };
  }

  // Pour les employés avec organization object
  if (user.organization) {
    return {
      id: user.organization.id || user.organization,
      slug: user.organization.subdomain || user.organization.slug,
    };
  }

  return null;
}

/**
 * Récupère l'organization ID depuis l'URL courante
 */
export function getOrganizationIdFromURL(): string | null {
  if (typeof window === 'undefined') return null;

  // Extraire le slug depuis l'URL: /apps/[slug]/...
  const match = window.location.pathname.match(/\/apps\/([^\/]+)/);
  if (!match) return null;

  const slug = match[1];

  // Si on a le slug dans localStorage, retourner l'ID correspondant
  const storedSlug = getCurrentOrganizationSlug();
  if (storedSlug === slug) {
    return getCurrentOrganizationId();
  }

  return null;
}

/**
 * Récupère et initialise l'organization depuis le slug (appel async au backend)
 */
export async function initializeOrganizationFromSlug(slug: string): Promise<string | null> {
  try {
    const { organizationService } = await import('@/lib/services/core');
    const org = await organizationService.getBySlug(slug);

    if (org) {
      setCurrentOrganization(org.id, org.subdomain);
      return org.id;
    }
  } catch (error) {
    console.error('Error initializing organization:', error);
  }

  return null;
}

/**
 * Ajoute l'organization_id aux données d'une requête
 */
export function addOrganizationToData<T extends Record<string, any>>(data: T): T & { organization: string } {
  let orgId = getCurrentOrganizationId();

  // Si pas dans localStorage, essayer de récupérer depuis l'utilisateur
  if (!orgId) {
    const orgFromUser = getOrganizationFromUser();
    if (orgFromUser) {
      // Sauvegarder pour les prochaines fois
      setCurrentOrganization(orgFromUser.id, orgFromUser.slug);
      orgId = orgFromUser.id;
    }
  }

  // Si toujours pas d'org ID, essayer de récupérer depuis l'URL
  if (!orgId) {
    orgId = getOrganizationIdFromURL();
  }

  if (!orgId) {
    // Extraire le slug de l'URL pour un message d'erreur plus utile
    const slug = typeof window !== 'undefined'
      ? window.location.pathname.match(/\/apps\/([^\/]+)/)?.[1]
      : null;

    console.error('Organization ID not found. Current URL slug:', slug);
    console.error('Stored organization:', getCurrentOrganizationId(), getCurrentOrganizationSlug());
    console.error('User data:', tokenManager.getUser());

    throw new Error(
      `Organisation non définie pour "${slug}". ` +
      `L'application va tenter de récupérer l'organisation depuis le serveur. ` +
      `Si l'erreur persiste, rechargez la page.`
    );
  }

  return { ...data, organization: orgId };
}

/**
 * Ajoute organization_subdomain aux paramètres de requête
 */
export function addOrganizationToParams(params?: Record<string, string>): Record<string, string> {
  const slug = getCurrentOrganizationSlug();

  if (!slug) {
    // Essayer de récupérer depuis l'utilisateur
    const orgFromUser = getOrganizationFromUser();
    if (orgFromUser) {
      setCurrentOrganization(orgFromUser.id, orgFromUser.slug);
      return { ...params, organization_subdomain: orgFromUser.slug };
    }

    // Essayer depuis l'URL
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/\/apps\/([^\/]+)/);
      if (match) {
        return { ...params, organization_subdomain: match[1] };
      }
    }

    throw new Error('Organisation non trouvée');
  }

  return { ...params, organization_subdomain: slug };
}
