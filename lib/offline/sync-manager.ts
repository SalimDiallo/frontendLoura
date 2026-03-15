/**
 * Sync Manager - Gestion de la synchronisation des mutations offline
 *
 * Responsabilités:
 * - Détecter le passage online
 * - Rejouer les mutations en attente
 * - Gérer les erreurs et les retries
 * - Notifier l'UI de l'état de synchronisation
 */

import { apiClient } from '@/lib/api/client';
import { indexedDBManager, MutationEntry } from './indexeddb';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncState {
  status: SyncStatus;
  progress: number; // 0-100
  totalMutations: number;
  completedMutations: number;
  failedMutations: number;
  currentMutation?: string;
}

type SyncListener = (state: SyncState) => void;

class SyncManager {
  private isSyncing = false;
  private listeners: Set<SyncListener> = new Set();
  private syncState: SyncState = {
    status: 'idle',
    progress: 0,
    totalMutations: 0,
    completedMutations: 0,
    failedMutations: 0,
  };

  constructor() {
    // Écouter les changements online/offline
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[Sync] Connexion rétablie, démarrage de la synchronisation...');
        this.sync();
      });
    }
  }

  /**
   * Ajoute un listener pour les changements d'état de sync
   */
  addListener(listener: SyncListener): () => void {
    this.listeners.add(listener);
    // Envoyer l'état actuel immédiatement
    listener(this.syncState);

    // Retourner une fonction de cleanup
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notifie tous les listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.syncState));
  }

  /**
   * Met à jour l'état de synchronisation
   */
  private updateState(updates: Partial<SyncState>): void {
    this.syncState = { ...this.syncState, ...updates };
    this.notifyListeners();
  }

  /**
   * Lance la synchronisation des mutations en attente
   */
  async sync(): Promise<void> {
    // Si déjà en cours de sync, ignorer
    if (this.isSyncing) {
      console.log('[Sync] Synchronisation déjà en cours, skip');
      return;
    }

    // Vérifier si on est online
    if (typeof window !== 'undefined' && !window.navigator.onLine) {
      console.log('[Sync] Offline, synchronisation impossible');
      return;
    }

    this.isSyncing = true;
    this.updateState({ status: 'syncing', progress: 0 });

    try {
      // Récupérer toutes les mutations en attente
      const mutations = await indexedDBManager.getPendingMutations();

      if (mutations.length === 0) {
        console.log('[Sync] Aucune mutation en attente');
        this.updateState({
          status: 'idle',
          progress: 100,
          totalMutations: 0,
          completedMutations: 0,
          failedMutations: 0,
        });
        this.isSyncing = false;
        return;
      }

      console.log(`[Sync] ${mutations.length} mutation(s) à synchroniser`);
      this.updateState({
        totalMutations: mutations.length,
        completedMutations: 0,
        failedMutations: 0,
      });

      let completed = 0;
      let failed = 0;

      // Rejouer chaque mutation
      for (const mutation of mutations) {
        try {
          await this.replayMutation(mutation);
          completed++;
          await indexedDBManager.deleteMutation(mutation.id);
          console.log(`[Sync] Mutation ${mutation.id} synchronisée avec succès`);
        } catch (error) {
          console.error(`[Sync] Erreur synchronisation ${mutation.id}:`, error);

          // Incrémenter le retry count
          await indexedDBManager.incrementMutationRetry(mutation.id);

          // Si max retries atteint, supprimer la mutation
          if (mutation.retryCount >= mutation.maxRetries) {
            console.warn(`[Sync] Max retries atteint pour ${mutation.id}, suppression`);
            await indexedDBManager.deleteMutation(mutation.id);
          }

          failed++;
        }

        // Mettre à jour la progression
        const progress = Math.round(((completed + failed) / mutations.length) * 100);
        this.updateState({
          progress,
          completedMutations: completed,
          failedMutations: failed,
          currentMutation: mutation.endpoint,
        });
      }

      // Synchronisation terminée
      const status: SyncStatus = failed === 0 ? 'success' : failed === mutations.length ? 'error' : 'success';
      this.updateState({
        status,
        progress: 100,
        currentMutation: undefined,
      });

      console.log(`[Sync] Terminé: ${completed} succès, ${failed} échecs`);

      // Reset vers idle après 3 secondes
      setTimeout(() => {
        this.updateState({ status: 'idle' });
      }, 3000);

    } catch (error) {
      console.error('[Sync] Erreur lors de la synchronisation:', error);
      this.updateState({
        status: 'error',
        progress: 0,
      });

      // Reset vers idle après 3 secondes
      setTimeout(() => {
        this.updateState({ status: 'idle' });
      }, 3000);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Rejoue une mutation
   */
  private async replayMutation(mutation: MutationEntry): Promise<void> {
    console.log(`[Sync] Replay ${mutation.method} ${mutation.endpoint}`);

    // Restaurer le slug de l'organisation si nécessaire
    const originalSlug = typeof window !== 'undefined'
      ? localStorage.getItem('current_organization_slug')
      : null;

    if (mutation.organizationSlug && originalSlug !== mutation.organizationSlug) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('current_organization_slug', mutation.organizationSlug);
      }
    }

    try {
      switch (mutation.method) {
        case 'POST':
          await apiClient.post(mutation.endpoint, mutation.data);
          break;
        case 'PUT':
          await apiClient.put(mutation.endpoint, mutation.data);
          break;
        case 'PATCH':
          await apiClient.patch(mutation.endpoint, mutation.data);
          break;
        case 'DELETE':
          await apiClient.delete(mutation.endpoint);
          break;
        default:
          throw new Error(`Méthode HTTP non supportée: ${mutation.method}`);
      }
    } finally {
      // Restaurer le slug original
      if (originalSlug && mutation.organizationSlug && originalSlug !== mutation.organizationSlug) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('current_organization_slug', originalSlug);
        }
      }
    }
  }

  /**
   * Force une synchronisation manuelle
   */
  async forceSync(): Promise<void> {
    console.log('[Sync] Synchronisation forcée');
    await this.sync();
  }

  /**
   * Récupère l'état actuel de synchronisation
   */
  getState(): SyncState {
    return this.syncState;
  }

  /**
   * Récupère le nombre de mutations en attente
   */
  async getPendingCount(): Promise<number> {
    return await indexedDBManager.getMutationsCount();
  }
}

// Export d'une instance singleton
export const syncManager = new SyncManager();
