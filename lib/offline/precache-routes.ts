/**
 * Pré-cache intelligent des routes critiques
 *
 * Cette fonction pré-charge les routes essentielles en arrière-plan
 * pour améliorer les performances offline
 */

'use client';

export const CRITICAL_ROUTES = [
  // Auth routes
  '/auth/admin',
  '/auth/employee',

  // Core routes
  '/core/dashboard',
  '/core/dashboard/organizations',

  // Peut être étendu avec d'autres routes critiques
];

/**
 * Pré-charge les routes critiques en arrière-plan
 */
export async function precacheRoutes(routes: string[] = CRITICAL_ROUTES): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    // Attendre que le SW soit prêt
    const registration = await navigator.serviceWorker.ready;

    if (!registration.active) {
      console.log('[Precache] SW pas encore actif');
      return;
    }

    console.log(`[Precache] Pré-chargement de ${routes.length} routes...`);

    // Créer des requêtes HEAD pour pré-charger sans bloquer
    const promises = routes.map(async (route) => {
      try {
        const response = await fetch(route, {
          method: 'GET',
          cache: 'no-cache', // Force le SW à intercepter
        });

        if (response.ok) {
          console.log(`[Precache] ✓ ${route}`);
        } else {
          console.warn(`[Precache] ✗ ${route} (${response.status})`);
        }
      } catch (error) {
        console.warn(`[Precache] ✗ ${route}`, error);
      }
    });

    await Promise.allSettled(promises);
    console.log('[Precache] Pré-chargement terminé');

  } catch (error) {
    console.error('[Precache] Erreur:', error);
  }
}

/**
 * Hook pour pré-charger les routes au montage du composant
 */
export function usePrecacheRoutes(routes?: string[]) {
  if (typeof window !== 'undefined') {
    // Exécuter après le chargement initial
    if (document.readyState === 'complete') {
      precacheRoutes(routes);
    } else {
      window.addEventListener('load', () => precacheRoutes(routes));
    }
  }
}
