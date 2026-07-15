import { Injectable } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AppDB extends DBSchema {
  images: {
    key: string;
    value: {
      id: string;
      pdfHash: string;
      dataUrl: string;
    };
    indexes: { 'by-pdf': string };
  };
}

@Injectable({
  providedIn: 'root'
})
export class DbService {
  private dbPromise: Promise<IDBPDatabase<AppDB>>;

  constructor() {
    this.dbPromise = openDB<AppDB>('sila-translator-db', 1, {
      upgrade(db) {
        const store = db.createObjectStore('images', { keyPath: 'id' });
        store.createIndex('by-pdf', 'pdfHash');
      },
    });
  }

  async saveImage(id: string, pdfHash: string, dataUrl: string): Promise<void> {
    const db = await this.dbPromise;
    await db.put('images', { id, pdfHash, dataUrl });
  }

  async getImagesByPdf(pdfHash: string): Promise<{ id: string, dataUrl: string }[]> {
    const db = await this.dbPromise;
    return await db.getAllFromIndex('images', 'by-pdf', pdfHash);
  }

  async clearImagesByPdf(pdfHash: string): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction('images', 'readwrite');
    const index = tx.store.index('by-pdf');
    let cursor = await index.openCursor(pdfHash);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  }
}
