/**
 * Data Warmup - Orchestrateur central pour le téléchargement offline-first
 *
 * Ce système télécharge TOUTES les données nécessaires dès la connexion
 * de l'utilisateur pour garantir un fonctionnement offline complet.
 *
 * Phases:
 * 1. Données critiques (auth, orgs, config) - Séquentiel
 * 2. Données de liste (employees, products, etc.) - Batch parallèle
 * 3. Données de détail (par ID) - Batch parallèle différé
 * 4. Données statistiques - Batch parallèle basse priorité
 */

'use client';

import { API_ENDPOINTS } from '@/lib/api/config';
import { indexedDBManager } from './indexeddb';

// ============================================================
// Types
// ============================================================

export interface WarmupProgress {
  phase: 'idle' | 'critical' | 'lists' | 'details' | 'stats' | 'complete' | 'error';
  totalEndpoints: number;
  completedEndpoints: number;
  failedEndpoints: number;
  percentage: number;
  currentEndpoint?: string;
  startedAt?: number;
  completedAt?: number;
  errors: WarmupError[];
}

interface WarmupError {
  endpoint: string;
  status?: number;
  message: string;
}

interface EndpointTask {
  endpoint: string;
  ttl: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  requiresAuth: boolean;
}

type WarmupListener = (progress: WarmupProgress) => void;

// ============================================================
// TTL Configuration
// ============================================================

const TTL = {
  CRITICAL: 10 * 60 * 1000,   // 10 min - auth, org config
  HIGH: 15 * 60 * 1000,       // 15 min - listes principales
  MEDIUM: 30 * 60 * 1000,     // 30 min - données secondaires
  LOW: 60 * 60 * 1000,        // 1h - stats, rapports
  STATIC: 2 * 60 * 60 * 1000, // 2h - données quasi-statiques (categories, modules)
};

const WARMUP_STATE_KEY = 'loura_warmup_state';
const WARMUP_BATCH_SIZE = 5;       // Requêtes parallèles simultanées
const WARMUP_BATCH_DELAY = 100;    // Délai entre les batchs (ms)
const WARMUP_COOLDOWN = 5 * 60 * 1000; // 5 min entre deux warmups

// ============================================================
// Static endpoints (no dynamic params)
// ============================================================

function getStaticEndpoints(): EndpointTask[] {
  return [
    // --- CRITICAL: Auth & Config ---
    { endpoint: API_ENDPOINTS.AUTH.ME, ttl: TTL.CRITICAL, priority: 'critical', requiresAuth: true },
    { endpoint: API_ENDPOINTS.CORE.ORGANIZATIONS.LIST, ttl: TTL.CRITICAL, priority: 'critical', requiresAuth: true },
    { endpoint: API_ENDPOINTS.CORE.CATEGORIES.LIST, ttl: TTL.STATIC, priority: 'critical', requiresAuth: false },
    { endpoint: API_ENDPOINTS.CORE.MODULES.LIST, ttl: TTL.STATIC, priority: 'critical', requiresAuth: false },
    { endpoint: API_ENDPOINTS.CORE.MODULES.DEFAULTS, ttl: TTL.STATIC, priority: 'critical', requiresAuth: false },
    { endpoint: API_ENDPOINTS.CORE.MODULES.BY_CATEGORY, ttl: TTL.STATIC, priority: 'critical', requiresAuth: false },
    { endpoint: API_ENDPOINTS.CORE.ORGANIZATION_MODULES.LIST, ttl: TTL.HIGH, priority: 'critical', requiresAuth: true },

    // --- HIGH: HR Lists ---
    { endpoint: API_ENDPOINTS.HR.EMPLOYEES.LIST, ttl: TTL.HIGH, priority: 'high', requiresAuth: true },
    { endpoint: API_ENDPOINTS.HR.DEPARTMENTS.LIST, ttl: TTL.HIGH, priority: 'high', requiresAuth: true },
    { endpoint: API_ENDPOINTS.HR.POSITIONS.LIST, ttl: TTL.MEDIUM, priority: 'high', requiresAuth: true },
    { endpoint: API_ENDPOINTS.HR.ROLES.LIST, ttl: TTL.MEDIUM, priority: 'high', requiresAuth: true },
    { endpoint: API_ENDPOINTS.HR.PERMISSIONS.LIST, ttl: TTL.STATIC, priority: 'high', requiresAuth: true },
    { endpoint: API_ENDPOINTS.HR.LEAVE_TYPES.LIST, ttl: TTL.MEDIUM, priority: 'high', requiresAuth: true },
    { endpoint: API_ENDPOINTS.HR.LEAVE_REQUESTS.LIST, ttl: TTL.HIGH, priority: 'high', requiresAuth: true },
    { endpoint: API_ENDPOINTS.HR.LEAVE_REQUESTS.MY_BALANCES, ttl: TTL.HIGH, priority: 'high', requiresAuth: true },
    { endpoint: API_ENDPOINTS.HR.LEAVE_BALANCES.LIST, ttl: TTL.HIGH, priority: 'high', requiresAuth: true },
    { endpoint: API_ENDPOINTS.HR.ATTENDANCES.LIST, ttl: TTL.HIGH, priority: 'high', requiresAuth: true },
    { endpoint: API_ENDPOINTS.HR.ATTENDANCES.TODAY, ttl: TTL.CRITICAL, priority: 'high', requiresAuth: true },
    { endpoint: API_ENDPOINTS.HR.CONTRACTS.LIST, ttl: TTL.MEDIUM, priority: 'high', requiresAuth: true },
    { endpoint: API_ENDPOINTS.HR.CALENDAR.LIST, ttl: TTL.MEDIUM, priority: 'high', requiresAuth: true },

    // --- HIGH: Inventory Lists ---
    { endpoint: API_ENDPOINTS.INVENTORY.CATEGORIES.LIST, ttl: TTL.MEDIUM, priority: 'high', requiresAuth: true },
    { endpoint: API_ENDPOINTS.INVENTORY.PRODUCTS.LIST, ttl: TTL.HIGH, priority: 'high', requiresAuth: true },
    { endpoint: API_ENDPOINTS.INVENTORY.WAREHOUSES.LIST, ttl: TTL.MEDIUM, priority: 'high', requiresAuth: true },
    { endpoint: API_ENDPOINTS.INVENTORY.SUPPLIERS.LIST, ttl: TTL.MEDIUM, priority: 'high', requiresAuth: true },
    { endpoint: API_ENDPOINTS.INVENTORY.CUSTOMERS.LIST, ttl: TTL.HIGH, priority: 'high', requiresAuth: true },
    { endpoint: API_ENDPOINTS.INVENTORY.SALES.LIST, ttl: TTL.HIGH, priority: 'high', requiresAuth: true },
    { endpoint: API_ENDPOINTS.INVENTORY.EXPENSES.LIST, ttl: TTL.HIGH, priority: 'high', requiresAuth: true },
    { endpoint: API_ENDPOINTS.INVENTORY.ORDERS.LIST, ttl: TTL.HIGH, priority: 'high', requiresAuth: true },
    { endpoint: API_ENDPOINTS.INVENTORY.STOCKS.LIST, ttl: TTL.HIGH, priority: 'high', requiresAuth: true },
    { endpoint: API_ENDPOINTS.INVENTORY.MOVEMENTS.LIST, ttl: TTL.HIGH, priority: 'high', requiresAuth: true },
    { endpoint: API_ENDPOINTS.INVENTORY.ALERTS.LIST, ttl: TTL.HIGH, priority: 'high', requiresAuth: true },
    { endpoint: API_ENDPOINTS.INVENTORY.STOCK_COUNTS.LIST, ttl: TTL.MEDIUM, priority: 'high', requiresAuth: true },
    { endpoint: API_ENDPOINTS.INVENTORY.PROFORMAS.LIST, ttl: TTL.MEDIUM, priority: 'high', requiresAuth: true },
    { endpoint: API_ENDPOINTS.INVENTORY.DELIVERY_NOTES.LIST, ttl: TTL.MEDIUM, priority: 'high', requiresAuth: true },
    { endpoint: API_ENDPOINTS.INVENTORY.CREDIT_SALES.LIST, ttl: TTL.HIGH, priority: 'high', requiresAuth: true },
    { endpoint: API_ENDPOINTS.INVENTORY.EXPENSE_CATEGORIES.LIST, ttl: TTL.MEDIUM, priority: 'high', requiresAuth: true },

    // --- MEDIUM: Payroll ---
    { endpoint: API_ENDPOINTS.HR.PAYROLL_PERIODS.LIST, ttl: TTL.MEDIUM, priority: 'medium', requiresAuth: true },
    { endpoint: API_ENDPOINTS.HR.PAYSLIPS.LIST, ttl: TTL.MEDIUM, priority: 'medium', requiresAuth: true },
    { endpoint: API_ENDPOINTS.HR.PAYSLIPS.HISTORY, ttl: TTL.MEDIUM, priority: 'medium', requiresAuth: true },
    { endpoint: API_ENDPOINTS.HR.PAYROLL_ADVANCES.LIST, ttl: TTL.MEDIUM, priority: 'medium', requiresAuth: true },
    { endpoint: API_ENDPOINTS.HR.PAYROLL_ADVANCES.HISTORY, ttl: TTL.MEDIUM, priority: 'medium', requiresAuth: true },

    // --- MEDIUM: Commercial docs ---
    { endpoint: API_ENDPOINTS.INVENTORY.CREDIT_SALES.SUMMARY, ttl: TTL.MEDIUM, priority: 'medium', requiresAuth: true },
    { endpoint: API_ENDPOINTS.INVENTORY.EXPENSES.SUMMARY, ttl: TTL.MEDIUM, priority: 'medium', requiresAuth: true },
    { endpoint: API_ENDPOINTS.INVENTORY.CATEGORIES.TREE, ttl: TTL.MEDIUM, priority: 'medium', requiresAuth: true },

    // --- LOW: Statistics ---
    { endpoint: API_ENDPOINTS.HR.STATS.OVERVIEW, ttl: TTL.LOW, priority: 'low', requiresAuth: true },
    { endpoint: API_ENDPOINTS.HR.STATS.DEPARTMENTS, ttl: TTL.LOW, priority: 'low', requiresAuth: true },
    { endpoint: API_ENDPOINTS.HR.STATS.LEAVES, ttl: TTL.LOW, priority: 'low', requiresAuth: true },
    { endpoint: API_ENDPOINTS.HR.STATS.PAYROLL, ttl: TTL.LOW, priority: 'low', requiresAuth: true },
    { endpoint: API_ENDPOINTS.HR.ATTENDANCES.STATS, ttl: TTL.LOW, priority: 'low', requiresAuth: true },
    { endpoint: API_ENDPOINTS.INVENTORY.STATS.OVERVIEW, ttl: TTL.LOW, priority: 'low', requiresAuth: true },
    { endpoint: API_ENDPOINTS.INVENTORY.STATS.TOP_PRODUCTS, ttl: TTL.LOW, priority: 'low', requiresAuth: true },
    { endpoint: API_ENDPOINTS.INVENTORY.STATS.STOCK_BY_WAREHOUSE, ttl: TTL.LOW, priority: 'low', requiresAuth: true },
    { endpoint: API_ENDPOINTS.INVENTORY.STATS.STOCK_BY_CATEGORY, ttl: TTL.LOW, priority: 'low', requiresAuth: true },
    { endpoint: API_ENDPOINTS.INVENTORY.STATS.MOVEMENT_HISTORY, ttl: TTL.LOW, priority: 'low', requiresAuth: true },
    { endpoint: API_ENDPOINTS.INVENTORY.STATS.LOW_ROTATION_PRODUCTS, ttl: TTL.LOW, priority: 'low', requiresAuth: true },
    { endpoint: API_ENDPOINTS.INVENTORY.STATS.STOCK_COUNTS_SUMMARY, ttl: TTL.LOW, priority: 'low', requiresAuth: true },
    { endpoint: API_ENDPOINTS.INVENTORY.STATS.FINANCIAL_ANALYSIS, ttl: TTL.LOW, priority: 'low', requiresAuth: true },
    { endpoint: API_ENDPOINTS.INVENTORY.STATS.ABC_ANALYSIS, ttl: TTL.LOW, priority: 'low', requiresAuth: true },
    { endpoint: API_ENDPOINTS.INVENTORY.STATS.CREDITS_REPORT, ttl: TTL.LOW, priority: 'low', requiresAuth: true },
    { endpoint: API_ENDPOINTS.INVENTORY.STATS.SALES_PERFORMANCE, ttl: TTL.LOW, priority: 'low', requiresAuth: true },

    // --- LOW: Notifications ---
    { endpoint: API_ENDPOINTS.NOTIFICATIONS.LIST, ttl: TTL.HIGH, priority: 'low', requiresAuth: true },
    { endpoint: API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT, ttl: TTL.CRITICAL, priority: 'low', requiresAuth: true },
  ];
}

// ============================================================
// Dynamic endpoint generator (from fetched data)
// ============================================================

interface DynamicIds {
  employees: string[];
  departments: string[];
  products: string[];
  customers: string[];
  suppliers: string[];
  warehouses: string[];
  organizations: string[];
}

function generateDetailEndpoints(ids: DynamicIds): EndpointTask[] {
  const tasks: EndpointTask[] = [];

  // Organization details
  for (const id of ids.organizations) {
    tasks.push({
      endpoint: API_ENDPOINTS.CORE.ORGANIZATIONS.DETAIL(id),
      ttl: TTL.HIGH,
      priority: 'medium',
      requiresAuth: true,
    });
  }

  // Employee details (limit to 20 most important)
  for (const id of ids.employees.slice(0, 20)) {
    tasks.push({
      endpoint: API_ENDPOINTS.HR.EMPLOYEES.DETAIL(id),
      ttl: TTL.MEDIUM,
      priority: 'medium',
      requiresAuth: true,
    });
  }

  // Department details
  for (const id of ids.departments.slice(0, 15)) {
    tasks.push({
      endpoint: API_ENDPOINTS.HR.DEPARTMENTS.DETAIL(id),
      ttl: TTL.MEDIUM,
      priority: 'medium',
      requiresAuth: true,
    });
  }

  // Product details (limit to 30)
  for (const id of ids.products.slice(0, 30)) {
    tasks.push({
      endpoint: API_ENDPOINTS.INVENTORY.PRODUCTS.DETAIL(id),
      ttl: TTL.MEDIUM,
      priority: 'medium',
      requiresAuth: true,
    });
  }

  // Customer details (limit to 20)
  for (const id of ids.customers.slice(0, 20)) {
    tasks.push({
      endpoint: API_ENDPOINTS.INVENTORY.CUSTOMERS.DETAIL(id),
      ttl: TTL.MEDIUM,
      priority: 'low',
      requiresAuth: true,
    });
  }

  // Supplier details (limit to 10)
  for (const id of ids.suppliers.slice(0, 10)) {
    tasks.push({
      endpoint: API_ENDPOINTS.INVENTORY.SUPPLIERS.DETAIL(id),
      ttl: TTL.MEDIUM,
      priority: 'low',
      requiresAuth: true,
    });
  }

  // Warehouse details + stats
  for (const id of ids.warehouses.slice(0, 10)) {
    tasks.push({
      endpoint: API_ENDPOINTS.INVENTORY.WAREHOUSES.DETAIL(id),
      ttl: TTL.MEDIUM,
      priority: 'low',
      requiresAuth: true,
    });
    tasks.push({
      endpoint: API_ENDPOINTS.INVENTORY.WAREHOUSES.INVENTORY(id),
      ttl: TTL.MEDIUM,
      priority: 'low',
      requiresAuth: true,
    });
  }

  return tasks;
}

// ============================================================
// DataWarmup Manager
// ============================================================

class DataWarmupManager {
  private isRunning = false;
  private listeners: Set<WarmupListener> = new Set();
  private abortController: AbortController | null = null;
  private progress: WarmupProgress = {
    phase: 'idle',
    totalEndpoints: 0,
    completedEndpoints: 0,
    failedEndpoints: 0,
    percentage: 0,
    errors: [],
  };

  /**
   * S'abonner aux changements de progression
   */
  subscribe(listener: WarmupListener): () => void {
    this.listeners.add(listener);
    listener(this.progress);
    return () => this.listeners.delete(listener);
  }

  /**
   * Récupère la progression courante
   */
  getProgress(): WarmupProgress {
    return { ...this.progress };
  }

  /**
   * Vérifie si un warmup récent a déjà été effectué
   */
  private hasRecentWarmup(): boolean {
    try {
      const stateStr = localStorage.getItem(WARMUP_STATE_KEY);
      if (!stateStr) return false;
      const state = JSON.parse(stateStr);
      return state.completedAt && (Date.now() - state.completedAt) < WARMUP_COOLDOWN;
    } catch {
      return false;
    }
  }

  /**
   * Lance le warmup complet
   */
  async startWarmup(options: { force?: boolean } = {}): Promise<void> {
    if (this.isRunning) {
      console.log('[Warmup] Déjà en cours, skip');
      return;
    }

    // Vérifier le cooldown
    if (!options.force && this.hasRecentWarmup()) {
      console.log('[Warmup] Warmup récent détecté, skip (cooldown 5min)');
      return;
    }

    // Vérifier qu'on est online
    if (typeof window !== 'undefined' && !navigator.onLine) {
      console.log('[Warmup] Offline, skip');
      return;
    }

    // Vérifier le token
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      console.log('[Warmup] Pas de token, skip');
      return;
    }

    this.isRunning = true;
    this.abortController = new AbortController();

    console.log('\n[Warmup] 🚀 Démarrage du téléchargement offline-first...\n');

    this.updateProgress({
      phase: 'critical',
      totalEndpoints: 0,
      completedEndpoints: 0,
      failedEndpoints: 0,
      percentage: 0,
      errors: [],
      startedAt: Date.now(),
    });

    try {
      // Phase 1: Endpoints statiques critiques
      const staticTasks = getStaticEndpoints();
      const criticalTasks = staticTasks.filter(t => t.priority === 'critical');
      const highTasks = staticTasks.filter(t => t.priority === 'high');
      const mediumTasks = staticTasks.filter(t => t.priority === 'medium');
      const lowTasks = staticTasks.filter(t => t.priority === 'low');

      const totalStatic = staticTasks.length;
      this.updateProgress({ totalEndpoints: totalStatic });

      // Phase 1: Critical (séquentiel pour fiabilité)
      console.log(`[Warmup] 📋 Phase 1: ${criticalTasks.length} endpoints critiques`);
      await this.executeTasks(criticalTasks, 2); // 2 en parallèle max

      // Phase 2: Extraire les IDs depuis le cache pour générer les endpoints de détail
      this.updateProgress({ phase: 'lists' });
      console.log(`[Warmup] 📋 Phase 2: ${highTasks.length} listes principales`);
      await this.executeTasks(highTasks, WARMUP_BATCH_SIZE);

      // Phase 3: Générer et exécuter les endpoints de détail
      this.updateProgress({ phase: 'details' });
      const dynamicIds = await this.extractIdsFromCache();
      const detailTasks = generateDetailEndpoints(dynamicIds);

      if (detailTasks.length > 0) {
        const updatedTotal = totalStatic + detailTasks.length;
        this.updateProgress({ totalEndpoints: updatedTotal });
        console.log(`[Warmup] 📋 Phase 3: ${detailTasks.length} détails (${dynamicIds.employees.length} employés, ${dynamicIds.products.length} produits...)`);
        await this.executeTasks(detailTasks, WARMUP_BATCH_SIZE);
      }

      // Phase 4: Medium + Low
      this.updateProgress({ phase: 'stats' });
      const remainingTasks = [...mediumTasks, ...lowTasks];
      console.log(`[Warmup] 📋 Phase 4: ${remainingTasks.length} données secondaires + stats`);
      await this.executeTasks(remainingTasks, WARMUP_BATCH_SIZE);

      // Terminé !
      const completedAt = Date.now();
      const duration = ((completedAt - (this.progress.startedAt || completedAt)) / 1000).toFixed(1);

      this.updateProgress({
        phase: 'complete',
        percentage: 100,
        completedAt,
      });

      // Sauvegarder l'état
      localStorage.setItem(WARMUP_STATE_KEY, JSON.stringify({
        completedAt,
        totalEndpoints: this.progress.totalEndpoints,
        completedEndpoints: this.progress.completedEndpoints,
        failedEndpoints: this.progress.failedEndpoints,
      }));

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[Warmup] ✅ TÉLÉCHARGEMENT OFFLINE TERMINÉ');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`⏱️  Durée:      ${duration}s`);
      console.log(`✅ Succès:     ${this.progress.completedEndpoints}`);
      console.log(`❌ Échecs:     ${this.progress.failedEndpoints}`);
      console.log(`📦 Total:      ${this.progress.completedEndpoints}/${this.progress.totalEndpoints}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error: any) {
      console.error('[Warmup] ❌ Erreur globale:', error);
      this.updateProgress({ phase: 'error' });
    } finally {
      this.isRunning = false;
      this.abortController = null;
    }
  }

  /**
   * Annule le warmup en cours
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.isRunning = false;
      console.log('[Warmup] ⏹️ Annulé');
    }
  }

  /**
   * Force un re-warmup complet (efface le cooldown)
   */
  async forceWarmup(): Promise<void> {
    localStorage.removeItem(WARMUP_STATE_KEY);
    return this.startWarmup({ force: true });
  }

  /**
   * Réinitialise l'état du warmup
   */
  reset(): void {
    localStorage.removeItem(WARMUP_STATE_KEY);
    this.progress = {
      phase: 'idle',
      totalEndpoints: 0,
      completedEndpoints: 0,
      failedEndpoints: 0,
      percentage: 0,
      errors: [],
    };
    this.notifyListeners();
  }

  // ========================================================
  // Private methods
  // ========================================================

  private updateProgress(updates: Partial<WarmupProgress>): void {
    this.progress = { ...this.progress, ...updates };

    // Recalculate percentage
    if (this.progress.totalEndpoints > 0) {
      const done = this.progress.completedEndpoints + this.progress.failedEndpoints;
      this.progress.percentage = Math.round((done / this.progress.totalEndpoints) * 100);
    }

    this.notifyListeners();
  }

  private notifyListeners(): void {
    const snapshot = { ...this.progress };
    this.listeners.forEach(l => l(snapshot));
  }

  /**
   * Exécute un batch de tâches avec contrôle de concurrence
   */
  private async executeTasks(tasks: EndpointTask[], concurrency: number): Promise<void> {
    for (let i = 0; i < tasks.length; i += concurrency) {
      // Vérifier l'annulation
      if (this.abortController?.signal.aborted) {
        console.log('[Warmup] Annulé pendant l\'exécution');
        return;
      }

      // Vérifier qu'on est toujours online
      if (typeof window !== 'undefined' && !navigator.onLine) {
        console.warn('[Warmup] Passé offline, pause...');
        // Attendre le retour online
        await this.waitForOnline();
      }

      const batch = tasks.slice(i, i + concurrency);
      await Promise.allSettled(
        batch.map(task => this.fetchAndCache(task))
      );

      // Petit délai entre les batches pour ne pas surcharger
      if (i + concurrency < tasks.length) {
        await new Promise(r => setTimeout(r, WARMUP_BATCH_DELAY));
      }
    }
  }

  /**
   * Fetch un endpoint et le stocke dans IndexedDB
   */
  private async fetchAndCache(task: EndpointTask): Promise<void> {
    const { endpoint, ttl, requiresAuth } = task;

    this.updateProgress({ currentEndpoint: endpoint });

    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

      // Construire l'URL avec organization_subdomain si nécessaire
      let url = `${baseURL}${endpoint}`;
      const orgSlug = localStorage.getItem('current_organization_slug');
      const isAuthEndpoint = endpoint.includes('/auth/');

      if (!isAuthEndpoint && orgSlug && !url.includes('organization_subdomain=')) {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}organization_subdomain=${orgSlug}`;
      }

      // Préparer le headers
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      if (requiresAuth) {
        const token = localStorage.getItem('access_token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: this.abortController?.signal,
      });

      if (response.ok) {
        try {
          const data = await response.json();
          await indexedDBManager.setCache(endpoint, data, ttl);
          this.updateProgress({
            completedEndpoints: this.progress.completedEndpoints + 1,
          });
        } catch {
          // Réponse non-JSON, on skip
          this.updateProgress({
            failedEndpoints: this.progress.failedEndpoints + 1,
            errors: [...this.progress.errors, {
              endpoint,
              message: 'Invalid JSON response',
            }],
          });
        }
      } else if (response.status === 401 || response.status === 403) {
        // Auth requise mais pas de perm - pas une vraie erreur
        this.updateProgress({
          completedEndpoints: this.progress.completedEndpoints + 1,
        });
      } else if (response.status === 404) {
        // Endpoint n'existe pas, skip silencieusement
        this.updateProgress({
          completedEndpoints: this.progress.completedEndpoints + 1,
        });
      } else {
        this.updateProgress({
          failedEndpoints: this.progress.failedEndpoints + 1,
          errors: [...this.progress.errors, {
            endpoint,
            status: response.status,
            message: `HTTP ${response.status}`,
          }],
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;

      this.updateProgress({
        failedEndpoints: this.progress.failedEndpoints + 1,
        errors: [...this.progress.errors, {
          endpoint,
          message: error.message || 'Network error',
        }],
      });
    }
  }

  /**
   * Extraire les IDs depuis les données déjà en cache (listes)
   */
  private async extractIdsFromCache(): Promise<DynamicIds> {
    const ids: DynamicIds = {
      employees: [],
      departments: [],
      products: [],
      customers: [],
      suppliers: [],
      warehouses: [],
      organizations: [],
    };

    try {
      // Organizations
      const orgs = await indexedDBManager.getCache(API_ENDPOINTS.CORE.ORGANIZATIONS.LIST);
      if (orgs) {
        const orgList = Array.isArray(orgs) ? orgs : (orgs as any).results || [];
        ids.organizations = orgList.map((o: any) => String(o.id)).filter(Boolean);
      }

      // Employees
      const emps = await indexedDBManager.getCache(API_ENDPOINTS.HR.EMPLOYEES.LIST);
      if (emps) {
        const empList = Array.isArray(emps) ? emps : (emps as any).results || [];
        ids.employees = empList.map((e: any) => String(e.id)).filter(Boolean);
      }

      // Departments
      const depts = await indexedDBManager.getCache(API_ENDPOINTS.HR.DEPARTMENTS.LIST);
      if (depts) {
        const deptList = Array.isArray(depts) ? depts : (depts as any).results || [];
        ids.departments = deptList.map((d: any) => String(d.id)).filter(Boolean);
      }

      // Products
      const prods = await indexedDBManager.getCache(API_ENDPOINTS.INVENTORY.PRODUCTS.LIST);
      if (prods) {
        const prodList = Array.isArray(prods) ? prods : (prods as any).results || [];
        ids.products = prodList.map((p: any) => String(p.id)).filter(Boolean);
      }

      // Customers
      const custs = await indexedDBManager.getCache(API_ENDPOINTS.INVENTORY.CUSTOMERS.LIST);
      if (custs) {
        const custList = Array.isArray(custs) ? custs : (custs as any).results || [];
        ids.customers = custList.map((c: any) => String(c.id)).filter(Boolean);
      }

      // Suppliers
      const supps = await indexedDBManager.getCache(API_ENDPOINTS.INVENTORY.SUPPLIERS.LIST);
      if (supps) {
        const suppList = Array.isArray(supps) ? supps : (supps as any).results || [];
        ids.suppliers = suppList.map((s: any) => String(s.id)).filter(Boolean);
      }

      // Warehouses
      const whs = await indexedDBManager.getCache(API_ENDPOINTS.INVENTORY.WAREHOUSES.LIST);
      if (whs) {
        const whList = Array.isArray(whs) ? whs : (whs as any).results || [];
        ids.warehouses = whList.map((w: any) => String(w.id)).filter(Boolean);
      }
    } catch (error) {
      console.warn('[Warmup] Erreur extraction IDs:', error);
    }

    return ids;
  }

  /**
   * Attend le retour online
   */
  private waitForOnline(): Promise<void> {
    return new Promise(resolve => {
      if (navigator.onLine) {
        resolve();
        return;
      }
      const handler = () => {
        window.removeEventListener('online', handler);
        resolve();
      };
      window.addEventListener('online', handler);
    });
  }
}

// ============================================================
// Export singleton
// ============================================================

export const dataWarmup = new DataWarmupManager();
