import { Component, ChangeDetectionStrategy, EventEmitter, Input, Output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Key, X, ExternalLink, EyeOff, Eye, Trash2 } from 'lucide-angular';

@Component({
  selector: 'app-api-key-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="api-key-title">
      <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-0 animate-in zoom-in-95 duration-200 overflow-hidden">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <lucide-icon [img]="Key" class="w-5 h-5 text-slate-800" aria-hidden="true"></lucide-icon>
            <h3 id="api-key-title" class="text-lg font-bold text-slate-900">Cấu hình Gemini API Key</h3>
          </div>
          <button (click)="closeModal.emit()" class="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 rounded-md p-1 cursor-pointer" aria-label="Đóng cấu hình">
            <lucide-icon [img]="XIcon" class="w-5 h-5" aria-hidden="true"></lucide-icon>
          </button>
        </div>
        <div class="p-6">
          <p class="text-slate-500 text-sm mb-4 leading-relaxed">
            Để sử dụng công cụ dịch file PDF này bạn cần khóa API Key của Gemini. Bạn hãy vào link "Nơi lấy API Key Gemini" để thao tác. Key miễn phí chỉ có hiệu lực nếu bạn dùng <a href="https://aistudio.google.com/apps/bb5c61b7-e110-49aa-933c-04c4ccd18e16?showPreview=true&showAssistant=true" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-700 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-sm">ứng dụng qua AI Studio</a>, với ai dùng trên pdf-silatranslator.wpsila.com, chỉ Key trả phí mới dùng được. Hãy remix ứng dụng trên AI Studio để dùng miễn phí.
          </p>

          <div class="flex items-center gap-2 text-sm mt-3 bg-slate-50/50 px-3 py-2 rounded-xl border border-slate-100">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                  [ngClass]="hasUserApiKey ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-700 border border-slate-200'">
              {{ hasUserApiKey ? 'Đang dùng API Key của bạn' : 'Bạn chưa nhập API Key cho ứng dụng' }}
            </span>
            <span class="text-slate-300">|</span>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-medium transition-colors cursor-pointer">
              <lucide-icon [img]="ExternalLink" class="w-3.5 h-3.5" aria-hidden="true"></lucide-icon>
              <span>Nơi lấy API Key Gemini</span>
            </a>
          </div>

          <div class="mt-5">
            <label for="gemini-custom-api-key" class="text-xs uppercase text-slate-500 font-bold tracking-wider block mb-2">GEMINI API KEY CÁ NHÂN</label>
            <div class="relative">
              <input 
                id="gemini-custom-api-key"
                [type]="showKeyPlain() ? 'text' : 'password'"
                [(ngModel)]="tempApiKey"
                class="block w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-mono tracking-wide"
                placeholder="Nhập AIzaSy..."
              >
              <button 
                type="button"
                (click)="toggleShowKeyPlain()"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                aria-label="Hiện/Ẩn API Key"
              >
                <lucide-icon [img]="showKeyPlain() ? EyeOff : Eye" class="w-4 h-4"></lucide-icon>
              </button>
            </div>
            <p class="text-[11px] text-slate-500 mt-2.5 italic leading-relaxed">
              Khóa API của bạn được lưu <strong class="text-slate-700 font-semibold">cục bộ tuyệt đối</strong> trong trình duyệt của bạn (<code class="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded text-indigo-600">LocalStorage</code>), không lưu trữ trên bất kỳ máy chủ nào khác.
            </p>
          </div>
        </div>
        <div class="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-between gap-3">
          <div>
            @if (hasUserApiKey) {
              <button 
                type="button" 
                (click)="onClearApiKey()" 
                class="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <lucide-icon [img]="Trash2" class="w-4 h-4" aria-hidden="true"></lucide-icon>
                <span>Xóa Key cá nhân</span>
              </button>
            }
          </div>
          <div class="flex gap-3">
            <button (click)="onSaveApiKey()" class="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm shadow-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer">
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ApiKeyModalComponent implements OnInit {
  readonly Key = Key;
  readonly XIcon = X;
  readonly ExternalLink = ExternalLink;
  readonly EyeOff = EyeOff;
  readonly Eye = Eye;
  readonly Trash2 = Trash2;

  @Input() initialApiKey = '';
  @Input() hasUserApiKey = false;
  
  @Output() save = new EventEmitter<string>();
  @Output() clear = new EventEmitter<void>();
  @Output() closeModal = new EventEmitter<void>();

  tempApiKey = '';
  showKeyPlain = signal<boolean>(false);

  ngOnInit() {
    this.tempApiKey = this.initialApiKey;
  }

  toggleShowKeyPlain() {
    this.showKeyPlain.update(v => !v);
  }

  onSaveApiKey() {
    this.save.emit(this.tempApiKey);
  }

  onClearApiKey() {
    this.tempApiKey = '';
    this.clear.emit();
  }
}
