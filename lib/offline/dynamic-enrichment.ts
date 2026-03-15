/**
 * Enrichissement Dynamique du Cache avec Données Réelles
 *
 * Ce système charge les organisations et ressources réelles de l'utilisateur
 * pour générer et cacher les routes et données dynamiques
 */

'use client';

import { indexedDBManager } from './indexeddb';

export interface DynamicEnrichmentProgress {
  organizations: number;
  routes: number;
  endpoints: number;
  inProgress: boolean;
}

interface Organization {
  id: string;
  slug: string;
  name: string;
}

interface ResourceIds {
  employees?: string[];
  departments?: string[];
  expenses?: string[];
  products?: string[];
  customers?: string[];
  [key: string]: string[] | undefined;
}

const ENRICHMENT_PROGRESS_KEY = 'loura_dynamic_enrichment_progress';

/**
 * Routes dynamiques à générer pour chaque organisation
 * Pattern: {orgSlug} sera remplacé par le vrai slug
 * Pattern: {id} sera remplacé par les vrais IDs
 */
const DYNAMIC_ROUTE_PATTERNS = {
  // Dashboard et profil
  dashboard: [
    '/apps/{orgSlug}/dashboard',
    '/apps/{orgSlug}/dashboard/profile',
    '/apps/{orgSlug}/dashboard/settings',
  ],

  // HR Module
  hr: [
    '/apps/{orgSlug}/hr',
    '/apps/{orgSlug}/hr/employees',
    '/apps/{orgSlug}/hr/employees/{employeeId}',
    '/apps/{orgSlug}/hr/employees/{employeeId}/edit',
    '/apps/{orgSlug}/hr/departments',
    '/apps/{orgSlug}/hr/departments/{departmentId}',
    '/apps/{orgSlug}/hr/departments/{departmentId}/edit',
    '/apps/{orgSlug}/hr/attendance',
    '/apps/{orgSlug}/hr/leaves',
    '/apps/{orgSlug}/hr/payroll',
  ],

  // Inventory Module
  inventory: [
    '/apps/{orgSlug}/inventory',
    '/apps/{orgSlug}/inventory/products',
    '/apps/{orgSlug}/inventory/products/{productId}',
    '/apps/{orgSlug}/inventory/products/{productId}/edit',
    '/apps/{orgSlug}/inventory/expenses',
    '/apps/{orgSlug}/inventory/expenses/{expenseId}',
    '/apps/{orgSlug}/inventory/expenses/{expenseId}/edit',
    '/apps/{orgSlug}/inventory/customers',
    '/apps/{orgSlug}/inventory/customers/{customerId}',
    '/apps/{orgSlug}/inventory/sales',
  ],
};

/**
 * Endpoints API dynamiques à cacher pour chaque organisation
 */
const DYNAMIC_API_PATTERNS = {
  hr: [
    '/hr/employees/',
    '/hr/employees/{employeeId}/',
    '/hr/departments/',
    '/hr/departments/{departmentId}/',
    '/hr/attendances/',
    '/hr/leave-requests/',
  ],

  inventory: [
    '/inventory/products/',
    '/inventory/products/{productId}/',
    '/inventory/expenses/',
    '/inventory/expenses/{expenseId}/',
    '/inventory/customers/',
    '/inventory/customers/{customerId}/',
    '/inventory/sales/',
  ],
};

/**
 * Récupère les organisations de l'utilisateur
 */
async function fetchUserOrganizations(): Promise<Organization[]> {
  try {
    // D'abord essayer depuis le cache IndexedDB
    const cached = await indexedDBManager.getCache('/core/organizations/');
    if (cached) {
      return Array.isArray(cached) ? cached : (cached as any).results || [];
    }

    // Sinon, faire une requête API
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    if (!token) {
      console.warn('[DynamicEnrich] Pas de token - skip');
      return [];
    }

    const response = await fetch(`${baseURL}/core/organizations/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('[DynamicEnrich] Erreur fetch organizations:', response.status);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.results || [];

  } catch (error) {
    console.error('[DynamicEnrich] Erreur chargement organisations:', error);
    return [];
  }
}

/**
 * Récupère les IDs des ressources pour une organisation
 */
async function fetchOrganizationResources(orgSlug: string): Promise<ResourceIds> {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  if (!token) {
    return {};
  }

  const resources: ResourceIds = {};

  // Headers communs
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'X-Organization-Slug': orgSlug, // Header pour le contexte org
  };

  // Charger les employés (premiers 5 IDs)
  try {
    const empResponse = await fetch(`${baseURL}/hr/employees/?page_size=5`, { headers });
    if (empResponse.ok) {
      const data = await empResponse.json();
      const employees = Array.isArray(data) ? data : data.results || [];
      resources.employees = employees.map((emp: any) => emp.id).slice(0, 5);
    }
  } catch (error) {
    console.warn('[DynamicEnrich] Erreur fetch employees:', error);
  }

  // Charger les départements
  try {
    const deptResponse = await fetch(`${baseURL}/hr/departments/?page_size=5`, { headers });
    if (deptResponse.ok) {
      const data = await deptResponse.json();
      const departments = Array.isArray(data) ? data : data.results || [];
      resources.departments = departments.map((dept: any) => dept.id).slice(0, 5);
    }
  } catch (error) {
    console.warn('[DynamicEnrich] Erreur fetch departments:', error);
  }

  // Charger les expenses (inventory)
  try {
    const expResponse = await fetch(`${baseURL}/inventory/expenses/?page_size=5`, { headers });
    if (expResponse.ok) {
      const data = await expResponse.json();
      const expenses = Array.isArray(data) ? data : data.results || [];
      resources.expenses = expenses.map((exp: any) => exp.id).slice(0, 5);
    }
  } catch (error) {
    console.warn('[DynamicEnrich] Erreur fetch expenses:', error);
  }

  // Charger les products
  try {
    const prodResponse = await fetch(`${baseURL}/inventory/products/?page_size=5`, { headers });
    if (prodResponse.ok) {
      const data = await prodResponse.json();
      const products = Array.isArray(data) ? data : data.results || [];
      resources.products = products.map((prod: any) => prod.id).slice(0, 5);
    }
  } catch (error) {
    console.warn('[DynamicEnrich] Erreur fetch products:', error);
  }

  // Charger les customers
  try {
    const custResponse = await fetch(`${baseURL}/inventory/customers/?page_size=5`, { headers });
    if (custResponse.ok) {
      const data = await custResponse.json();
      const customers = Array.isArray(data) ? data : data.results || [];
      resources.customers = customers.map((cust: any) => cust.id).slice(0, 5);
    }
  } catch (error) {
    console.warn('[DynamicEnrich] Erreur fetch customers:', error);
  }

  return resources;
}

/**
 * Génère les routes dynamiques pour une organisation
 */
function generateDynamicRoutes(orgSlug: string, resources: ResourceIds): string[] {
  const routes: string[] = [];

  Object.values(DYNAMIC_ROUTE_PATTERNS).forEach(patterns => {
    patterns.forEach(pattern => {
      // Remplacer {orgSlug}
      let route = pattern.replace('{orgSlug}', orgSlug);

      // Si contient {employeeId}, générer pour chaque employé
      if (route.includes('{employeeId}') && resources.employees) {
        resources.employees.forEach(id => {
          routes.push(route.replace('{employeeId}', id));
        });
      }
      // Si contient {departmentId}
      else if (route.includes('{departmentId}') && resources.departments) {
        resources.departments.forEach(id => {
          routes.push(route.replace('{departmentId}', id));
        });
      }
      // Si contient {productId}
      else if (route.includes('{productId}') && resources.products) {
        resources.products.forEach(id => {
          routes.push(route.replace('{productId}', id));
        });
      }
      // Si contient {expenseId}
      else if (route.includes('{expenseId}') && resources.expenses) {
        resources.expenses.forEach(id => {
          routes.push(route.replace('{expenseId}', id));
        });
      }
      // Si contient {customerId}
      else if (route.includes('{customerId}') && resources.customers) {
        resources.customers.forEach(id => {
          routes.push(route.replace('{customerId}', id));
        });
      }
      // Sinon, route sans paramètre ID
      else if (!route.includes('{')) {
        routes.push(route);
      }
    });
  });

  return routes;
}

/**
 * Génère les endpoints API dynamiques pour une organisation
 */
function generateDynamicEndpoints(resources: ResourceIds): string[] {
  const endpoints: string[] = [];

  Object.values(DYNAMIC_API_PATTERNS).forEach(patterns => {
    patterns.forEach(pattern => {
      // Si contient {employeeId}
      if (pattern.includes('{employeeId}') && resources.employees) {
        resources.employees.forEach(id => {
          endpoints.push(pattern.replace('{employeeId}', id));
        });
      }
      // Si contient {departmentId}
      else if (pattern.includes('{departmentId}') && resources.departments) {
        resources.departments.forEach(id => {
          endpoints.push(pattern.replace('{departmentId}', id));
        });
      }
      // Si contient {productId}
      else if (pattern.includes('{productId}') && resources.products) {
        resources.products.forEach(id => {
          endpoints.push(pattern.replace('{productId}', id));
        });
      }
      // Si contient {expenseId}
      else if (pattern.includes('{expenseId}') && resources.expenses) {
        resources.expenses.forEach(id => {
          endpoints.push(pattern.replace('{expenseId}', id));
        });
      }
      // Si contient {customerId}
      else if (pattern.includes('{customerId}') && resources.customers) {
        resources.customers.forEach(id => {
          endpoints.push(pattern.replace('{customerId}', id));
        });
      }
      // Sinon, endpoint sans paramètre
      else if (!pattern.includes('{')) {
        endpoints.push(pattern);
      }
    });
  });

  return endpoints;
}

/**
 * Cache une route dynamique via le Service Worker
 */
async function cacheDynamicRoute(route: string): Promise<boolean> {
  try {
    const response = await fetch(route, {
      method: 'GET',
      credentials: 'same-origin',
    });

    return response.ok || response.status === 401 || response.status === 403;
  } catch (error) {
    return false;
  }
}

/**
 * Cache un endpoint API dynamique dans IndexedDB
 */
async function cacheDynamicEndpoint(endpoint: string): Promise<boolean> {
  try {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    if (!token) {
      return false;
    }

    const response = await fetch(`${baseURL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      await indexedDBManager.setCache(endpoint, data, 10 * 60 * 1000); // 10 min
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Lance l'enrichissement dynamique complet
 */
export async function enrichCacheWithDynamicData(
  onProgress?: (progress: DynamicEnrichmentProgress) => void
): Promise<void> {
  try {
    console.log('[DynamicEnrich] 🔄 Démarrage enrichissement dynamique...\n');

    if (typeof window === 'undefined') {
      console.warn('[DynamicEnrich] Skip - SSR');
      return;
    }

    // Vérifier si déjà fait
    const existing = localStorage.getItem(ENRICHMENT_PROGRESS_KEY);
    if (existing) {
      const parsed = JSON.parse(existing);
      if (!parsed.inProgress && parsed.organizations > 0) {
        console.log('[DynamicEnrich] Déjà effectué');
        return;
      }
    }

    const progress: DynamicEnrichmentProgress = {
      organizations: 0,
      routes: 0,
      endpoints: 0,
      inProgress: true,
    };

    onProgress?.(progress);

    // 1. Charger les organisations
    console.log('[DynamicEnrich] 📋 Chargement des organisations...');
    const organizations = await fetchUserOrganizations();

    if (organizations.length === 0) {
      console.log('[DynamicEnrich] Aucune organisation trouvée');
      progress.inProgress = false;
      onProgress?.(progress);
      localStorage.setItem(ENRICHMENT_PROGRESS_KEY, JSON.stringify(progress));
      return;
    }

    console.log(`[DynamicEnrich] ✓ ${organizations.length} organisation(s) trouvée(s)\n`);

    // 2. Pour chaque organisation
    for (const org of organizations) {
      console.log(`[DynamicEnrich] 🏢 Organisation: ${org.name} (${org.slug})`);

      // Charger les ressources
      console.log(`[DynamicEnrich]    📦 Chargement des ressources...`);
      const resources = await fetchOrganizationResources(org.slug);

      const resourceCount = Object.values(resources).reduce((sum, arr) => sum + (arr?.length || 0), 0);
      console.log(`[DynamicEnrich]    ✓ ${resourceCount} ressource(s) chargée(s)`);

      // Générer les routes dynamiques
      const routes = generateDynamicRoutes(org.slug, resources);
      console.log(`[DynamicEnrich]    🔗 ${routes.length} route(s) dynamique(s) générée(s)`);

      // Générer les endpoints dynamiques
      const endpoints = generateDynamicEndpoints(resources);
      console.log(`[DynamicEnrich]    🗄️  ${endpoints.length} endpoint(s) dynamique(s) généré(s)`);

      // Cacher les routes (batch de 10)
      console.log(`[DynamicEnrich]    ⏳ Cache des routes...`);
      for (let i = 0; i < routes.length; i += 10) {
        const batch = routes.slice(i, i + 10);
        await Promise.all(batch.map(route => cacheDynamicRoute(route)));
        progress.routes += batch.length;
        onProgress?.(progress);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Cacher les endpoints (batch de 5)
      console.log(`[DynamicEnrich]    ⏳ Cache des endpoints...`);
      for (let i = 0; i < endpoints.length; i += 5) {
        const batch = endpoints.slice(i, i + 5);
        await Promise.all(batch.map(endpoint => cacheDynamicEndpoint(endpoint)));
        progress.endpoints += batch.length;
        onProgress?.(progress);
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      progress.organizations++;
      console.log(`[DynamicEnrich]    ✅ Organisation ${org.slug} complétée\n`);
    }

    progress.inProgress = false;
    onProgress?.(progress);

    // Sauvegarder la progression
    localStorage.setItem(ENRICHMENT_PROGRESS_KEY, JSON.stringify(progress));

    // Rapport final
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[DynamicEnrich] 📊 ENRICHISSEMENT TERMINÉ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🏢 Organisations:  ${progress.organizations}`);
    console.log(`🔗 Routes:         ${progress.routes}`);
    console.log(`🗄️  Endpoints:      ${progress.endpoints}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('[DynamicEnrich] ❌ Erreur:', error);
  }
}

/**
 * Réinitialise l'enrichissement dynamique
 */
export function resetDynamicEnrichment(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ENRICHMENT_PROGRESS_KEY);
  }
}

/**
 * Vérifie si l'enrichissement est terminé
 */
export function isDynamicEnrichmentComplete(): boolean {
  if (typeof window === 'undefined') return false;

  const cached = localStorage.getItem(ENRICHMENT_PROGRESS_KEY);
  if (!cached) return false;

  try {
    const progress = JSON.parse(cached);
    return !progress.inProgress && progress.organizations > 0;
  } catch {
    return false;
  }
}
