import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  type: 'error' | 'info' | 'success';
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);
  private toastIdCounter = 0;
  private toastTimeouts = new Set<ReturnType<typeof setTimeout>>();

  show(type: 'error' | 'info' | 'success', message: string, duration?: number) {
    const finalDuration = duration !== undefined ? duration : (type === 'error' ? 10000 : 5000);
    const id = this.toastIdCounter++;
    this.toasts.update(t => [...t, { id, type, message }]);
    
    const timeoutId = setTimeout(() => {
      this.remove(id);
      this.toastTimeouts.delete(timeoutId);
    }, finalDuration);
    
    this.toastTimeouts.add(timeoutId);
  }

  remove(id: number) {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }

  clearAll() {
    this.toastTimeouts.forEach(t => clearTimeout(t));
    this.toastTimeouts.clear();
    this.toasts.set([]);
  }
}
