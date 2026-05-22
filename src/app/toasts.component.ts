import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X } from 'lucide-angular';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none" aria-live="polite" aria-atomic="true">
      @for (toast of toasts(); track toast.id) {
        <div class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border bg-white min-w-[300px] max-w-md animate-in slide-in-from-right-8 fade-in duration-300"
             [class.border-red-200]="toast.type === 'error'"
             [class.border-emerald-200]="toast.type === 'success'"
             [class.border-blue-200]="toast.type === 'info'">
          
          <div class="shrink-0 w-2 h-2 rounded-full"
               [class.bg-red-500]="toast.type === 'error'"
               [class.bg-emerald-500]="toast.type === 'success'"
               [class.bg-blue-500]="toast.type === 'info'"></div>
               
          <p class="text-sm font-medium flex-1"
             [class.text-red-800]="toast.type === 'error'"
             [class.text-emerald-800]="toast.type === 'success'"
             [class.text-blue-800]="toast.type === 'info'">
            {{ toast.message }}
          </p>
          
          <button (click)="removeToast(toast.id)" class="shrink-0 p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer" aria-label="Đóng thông báo">
            <lucide-icon [img]="XIcon" class="w-4 h-4" aria-hidden="true"></lucide-icon>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastsComponent {
  readonly XIcon = X;
  private toastService = inject(ToastService);
  toasts = this.toastService.toasts;

  removeToast(id: number) {
    this.toastService.remove(id);
  }
}
