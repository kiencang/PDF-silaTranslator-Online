import { Component, ChangeDetectionStrategy, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ExternalLink, X } from 'lucide-angular';

@Component({
  selector: 'app-remix-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="remix-title">
      <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-0 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2">
            <lucide-icon [img]="ExternalLink" class="w-5 h-5 text-slate-800" aria-hidden="true"></lucide-icon>
            <h3 id="remix-title" class="text-lg font-bold text-slate-900">Cách remix ứng dụng về tài khoản cá nhân</h3>
          </div>
          <button (click)="closeModal.emit()" class="text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors focus:outline-none rounded-full p-2 cursor-pointer" aria-label="Đóng cấu hình">
            <lucide-icon [img]="XIcon" class="w-5 h-5" aria-hidden="true"></lucide-icon>
          </button>
        </div>
        <div class="p-6 overflow-y-auto">
          <p class="text-slate-600 text-sm mb-4 leading-relaxed">
            Chỉ ứng dụng dùng trên AI Studio mới dùng ngưỡng miễn phí thoải mái, hãy remix app này về AI Studio để tận dụng ngưỡng Free từ Gemini. 
            <a href="https://aistudio.google.com/apps/bb5c61b7-e110-49aa-933c-04c4ccd18e16?showAssistant=true&showPreview=true" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-700 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-sm font-medium">Vào app</a>, rồi remix như hình bên dưới.
          </p>
          
          <div class="mt-4 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
             <img src="/remix-pdf.png" alt="Hướng dẫn Remix app" referrerpolicy="no-referrer" class="w-full h-auto object-contain max-h-[60vh]">
          </div>
        </div>
        <div class="p-5 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button (click)="closeModal.emit()" class="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400">
            Đóng
          </button>
        </div>
      </div>
    </div>
  `
})
export class RemixModalComponent {
  XIcon = X;
  ExternalLink = ExternalLink;

  @Output() closeModal = new EventEmitter<void>();
}
