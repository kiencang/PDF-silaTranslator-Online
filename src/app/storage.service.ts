import { Injectable } from '@angular/core';

export interface TranslatedDoc {
  id?: number;
  originalFileName: string;
  vietnameseTitle: string;
  mode: string;
  timestamp: number;
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private dbName = 'SilaTranslatorDB';
  private storeName = 'translations';
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
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
    });
  }

  async saveTranslation(doc: TranslatedDoc): Promise<void> {
    const db = await this.initDB();
    
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
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(doc);

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Error saving translation');
    });
  }

  async getAll(): Promise<TranslatedDoc[]> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as TranslatedDoc[];
        // Return newest first
        resolve(results.sort((a, b) => b.timestamp - a.timestamp));
      };
      request.onerror = () => reject('Error fetching translations');
    });
  }

  async delete(id: number): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Error deleting translation');
    });
  }
}
