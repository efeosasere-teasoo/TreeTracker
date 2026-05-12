import { openDB, IDBPDatabase } from 'idb';
import { supabase } from './supabase';

const DB_NAME = 'treetracker-offline';
const STORE_TABLES = 'cached-data';
const STORE_QUEUE = 'sync-queue';

interface SyncItem {
  id?: number;
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: number;
}

export class OfflineManager {
  private db: Promise<IDBPDatabase>;
  private isSyncing = false;
  private retryCounts: Record<number, number> = {};

  constructor() {
    this.db = openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_TABLES);
        db.createObjectStore(STORE_QUEUE, { keyPath: 'id', autoIncrement: true });
      },
    });

    // Request persistent storage
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then(persistent => {
        if (persistent) console.log('Storage will not be cleared except by explicit user action');
        else console.warn('Storage may be cleared by the browser under storage pressure');
      });
    }

    // Listen for online event
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('Online detected. Triggering sync...');
        this.processQueue();
      });
    }
  }

  // --- Caching ---

  async cacheData(table: string, data: any[]) {
    const db = await this.db;
    await db.put(STORE_TABLES, data, table);
  }

  async getCachedData(table: string) {
    const db = await this.db;
    return db.get(STORE_TABLES, table);
  }

  // --- Queueing ---

  async enqueue(table: string, action: 'INSERT' | 'UPDATE' | 'DELETE', data: any) {
    const db = await this.db;
    const item: SyncItem = {
      table,
      action,
      data,
      timestamp: Date.now(),
    };
    const id = await db.add(STORE_QUEUE, item);
    
    if (navigator.onLine) {
      this.processQueue();
    }
    
    return { ...item, id };
  }

  async getPendingIds(table: string): Promise<Set<string>> {
    const db = await this.db;
    const queue = await db.getAll(STORE_QUEUE);
    const ids = new Set<string>();
    
    for (const item of queue) {
      if (item.table === table) {
        // Extract ID from data. For INSERT/UPDATE it's in data. For DELETE we might need to handle it differently.
        const idField = `${table.replace(/s$/, '')}_id`;
        if (item.action === 'DELETE') {
          ids.add(item.data); // data is the ID string for DELETE
        } else {
          ids.add(item.data[idField]);
        }
      }
    }
    return ids;
  }

  async getQueueSize() {
    const db = await this.db;
    return db.count(STORE_QUEUE);
  }

  async processQueue() {
    if (!navigator.onLine || this.isSyncing) return;
    
    this.isSyncing = true;
    const db = await this.db;
    
    try {
      const queue = await db.getAll(STORE_QUEUE);
      if (queue.length === 0) return;

      console.log(`Processing sync queue: ${queue.length} items`);

      for (const item of queue) {
        try {
          let error;
          if (item.action === 'INSERT') {
            ({ error } = await supabase.from(item.table).insert(item.data));
          } else if (item.action === 'UPDATE') {
            const idField = `${item.table.replace(/s$/, '')}_id`;
            ({ error } = await supabase.from(item.table).update(item.data).eq(idField, item.data[idField]));
          } else if (item.action === 'DELETE') {
            const idField = `${item.table.replace(/s$/, '')}_id`;
            ({ error } = await supabase.from(item.table).delete().eq(idField, item.data));
          }

          if (!error) {
            await db.delete(STORE_QUEUE, item.id!);
            delete this.retryCounts[item.id!];
          } else {
            console.error('Sync error:', error);
            // Handle specific errors (e.g. unique constraint might mean it's already there)
            if (error.code === '23505') { // Unique violation
              await db.delete(STORE_QUEUE, item.id!);
            } else {
              // Retry logic: cap retries
              this.retryCounts[item.id!] = (this.retryCounts[item.id!] || 0) + 1;
              if (this.retryCounts[item.id!] > 5) {
                console.warn('Max retries reached for sync item:', item);
                // Move to a dead-letter or just keep blocking? 
                // For now, continue to next to avoid blocking entire queue if possible
                continue; 
              }
              break; // Stop processing for now to preserve order
            }
          }
        } catch (err) {
          console.error('Network crash during sync:', err);
          break;
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  async forceSync() {
    await this.processQueue();
    return this.getQueueSize();
  }
}

export const offlineManager = new OfflineManager();
