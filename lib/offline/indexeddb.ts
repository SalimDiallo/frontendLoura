/**
 * IndexedDB Manager - Gestion du cache et des mutations offline
 *
 * Structure de la base de données:
 * - cache: Stocke les réponses des requêtes GET
 * - mutations: Queue des mutations (POST, PUT, PATCH, DELETE) en attente
 */

const DB_NAME = 'loura_offline_db';
const DB_VERSION = 1;

export interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  ttl: number; // Time to live en millisecondes
  endpoint: string;
}

export interface MutationEntry {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  organizationSlug?: string;
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialise la connexion à IndexedDB
   */
  private async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Erreur lors de l\'ouverture d\'IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store pour le cache des requêtes GET
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('endpoint', 'endpoint', { unique: false });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store pour la queue des mutations
        if (!db.objectStoreNames.contains('mutations')) {
          const mutationsStore = db.createObjectStore('mutations', { keyPath: 'id' });
          mutationsStore.createIndex('timestamp', 'timestamp', { unique: false });
          mutationsStore.createIndex('endpoint', 'endpoint', { unique: false });
        }
      };
    });

    return this.dbPromise;
  }

  /**
   * Génère une clé de cache unique
   */
  private generateCacheKey(endpoint: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${endpoint}:${paramString}`;
  }

  /**
   * Ajoute ou met à jour une entrée dans le cache
   */
  async setCache(endpoint: string, data: any, ttl: number = 5 * 60 * 1000, params?: Record<string, any>): Promise<void> {
    const db = await this.init();
    const key = this.generateCacheKey(endpoint, params);

    const entry: CacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      ttl,
      endpoint,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Erreur lors de l\'écriture du cache'));
    });
  }

  /**
   * Récupère une entrée du cache si elle est toujours valide
   */
  async getCache(endpoint: string, params?: Record<string, any>): Promise<any | null> {
    const db = await this.init();
    const key = this.generateCacheKey(endpoint, params);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined;

        if (!entry) {
          resolve(null);
          return;
        }

        // Vérifier si le cache est encore valide
        const isValid = (Date.now() - entry.timestamp) < entry.ttl;

        if (isValid) {
          resolve(entry.data);
        } else {
          // Cache expiré, le supprimer
          this.deleteCache(endpoint, params).catch(() => {});
          resolve(null);
        }
      };

      request.onerror = () => reject(new Error('Erreur lors de la lecture du cache'));
    });
  }

  /**
   * Supprime une entrée du cache
   */
  async deleteCache(endpoint: string, params?: Record<string, any>): Promise<void> {
    const db = await this.init();
    const key = this.generateCacheKey(endpoint, params);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Erreur lors de la suppression du cache'));
    });
  }

  /**
   * Vide tout le cache
   */
  async clearCache(): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Erreur lors du vidage du cache'));
    });
  }

  /**
   * Invalide le cache pour un endpoint spécifique
   */
  async invalidateCacheByEndpoint(endpoint: string): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('endpoint');
      const request = index.openCursor(IDBKeyRange.only(endpoint));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(new Error('Erreur lors de l\'invalidation du cache'));
    });
  }

  /**
   * Récupère une entrée du cache en IGNORANT le TTL
   * Essentiel pour le mode offline - retourne les données même expirées
   */
  async getCacheRaw(endpoint: string, params?: Record<string, any>): Promise<any | null> {
    const db = await this.init();
    const key = this.generateCacheKey(endpoint, params);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined;
        resolve(entry ? entry.data : null);
      };

      request.onerror = () => reject(new Error('Erreur lors de la lecture du cache raw'));
    });
  }

  /**
   * Invalide le cache pour tous les endpoints qui commencent par un préfixe
   * Ex: prefix '/hr/employees/' supprimera le cache de '/hr/employees/1/', '/hr/employees/2/', etc.
   */
  async invalidateCacheByPrefix(prefix: string): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('endpoint');
      const request = index.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const entry = cursor.value as CacheEntry;
          if (entry.endpoint.startsWith(prefix)) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(new Error('Erreur lors de l\'invalidation par préfixe'));
    });
  }

  /**
   * Ajoute une mutation à la queue
   */
  async addMutation(mutation: Omit<MutationEntry, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const db = await this.init();
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const entry: MutationEntry = {
      id,
      ...mutation,
      timestamp: Date.now(),
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['mutations'], 'readwrite');
      const store = transaction.objectStore('mutations');
      const request = store.add(entry);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(new Error('Erreur lors de l\'ajout de la mutation'));
    });
  }

  /**
   * Récupère toutes les mutations en attente
   */
  async getPendingMutations(): Promise<MutationEntry[]> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['mutations'], 'readonly');
      const store = transaction.objectStore('mutations');
      const request = store.getAll();

      request.onsuccess = () => {
        const mutations = request.result as MutationEntry[];
        // Trier par timestamp pour rejouer dans l'ordre
        mutations.sort((a, b) => a.timestamp - b.timestamp);
        resolve(mutations);
      };

      request.onerror = () => reject(new Error('Erreur lors de la récupération des mutations'));
    });
  }

  /**
   * Supprime une mutation de la queue
   */
  async deleteMutation(id: string): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['mutations'], 'readwrite');
      const store = transaction.objectStore('mutations');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Erreur lors de la suppression de la mutation'));
    });
  }

  /**
   * Met à jour le compteur de retry d'une mutation
   */
  async incrementMutationRetry(id: string): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['mutations'], 'readwrite');
      const store = transaction.objectStore('mutations');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const mutation = getRequest.result as MutationEntry;
        if (mutation) {
          mutation.retryCount += 1;
          const putRequest = store.put(mutation);

          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(new Error('Erreur lors de la mise à jour de la mutation'));
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(new Error('Erreur lors de la récupération de la mutation'));
    });
  }

  /**
   * Vide la queue des mutations
   */
  async clearMutations(): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['mutations'], 'readwrite');
      const store = transaction.objectStore('mutations');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Erreur lors du vidage des mutations'));
    });
  }

  /**
   * Compte le nombre de mutations en attente
   */
  async getMutationsCount(): Promise<number> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['mutations'], 'readonly');
      const store = transaction.objectStore('mutations');
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Erreur lors du comptage des mutations'));
    });
  }
}

// Export d'une instance singleton
export const indexedDBManager = new IndexedDBManager();
