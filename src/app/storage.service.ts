import { Injectable, inject } from '@angular/core';
import { DbService } from './db.service';

export interface TranslatedDoc {
  id?: number;
  originalFileName: string;
  vietnameseTitle: string;
  mode: string;
  timestamp: number;
  content: string;
  pdfHash?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private dbName = 'SilaTranslatorDB';
  private storeName = 'translations';
  private db: IDBDatabase | null = null;
  private isBrowser: boolean;

  private dbService = inject(DbService);

  constructor() {
    this.isBrowser = typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
    if (this.isBrowser) {
      this.initDB().catch(err => console.error('Error auto-initializing DB:', err));
    }
  }

  private async initDB(): Promise<IDBDatabase | null> {
    if (!this.isBrowser) return null;
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(this.dbName, 1);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
          }
        };

        request.onsuccess = (event: Event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          resolve(this.db!);
        };

        request.onerror = () => {
          reject('Error opening IndexedDB');
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  async saveTranslation(doc: TranslatedDoc): Promise<void> {
    if (!this.isBrowser) return;
    const db = await this.initDB();
    if (!db) return;
    
    // First, cleanup if more than 10
    const all = await this.getAll();
    if (all.length >= 10) {
      // Sort by timestamp and remove oldest
      const sorted = [...all].sort((a, b) => a.timestamp - b.timestamp);
      const toDeleteCount = all.length - 9; // We want to have 9 so after adding 1 it is 10
      const toDelete = sorted.slice(0, toDeleteCount);
      for (const item of toDelete) {
        if (item.id) await this.delete(item.id);
      }
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.add(doc);

        request.onsuccess = () => resolve();
        request.onerror = () => reject('Error saving translation');
      } catch (err) {
        reject(err);
      }
    });
  }

  async getAll(): Promise<TranslatedDoc[]> {
    if (!this.isBrowser) return [];
    const db = await this.initDB();
    if (!db) return [];

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          const results = request.result as TranslatedDoc[];
          // Return newest first
          resolve(results.sort((a, b) => b.timestamp - a.timestamp));
        };
        request.onerror = () => reject('Error fetching translations');
      } catch (err) {
        reject(err);
      }
    });
  }

  async delete(id: number): Promise<void> {
    if (!this.isBrowser) return;
    const db = await this.initDB();
    if (!db) return;

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject('Error deleting translation');
      } catch (err) {
        reject(err);
      }
    });
  }
}
