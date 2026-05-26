import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, FileText, User, Zap, Key } from 'lucide-angular';
import { SearchBarComponent } from './search-bar.component';

@Component({
  selector: 'app-header-controls',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, SearchBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="bg-white border-b border-slate-200 relative z-40">
      <div class="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3 md:h-16 md:py-0 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
        <div class="flex items-center gap-4">
          <!-- Logo and Title -->
          <div class="flex items-center gap-2">
            <div class="bg-indigo-600 text-white p-1.5 rounded-lg shrink-0">
              <lucide-icon [img]="FileText" class="w-5 h-5" aria-hidden="true"></lucide-icon>
            </div>
            <div class="hidden sm:block">
              <h1 class="text-xl font-bold font-display tracking-tight text-slate-900 leading-tight">
                PDF silaTranslator
              </h1>
              <button 
                type="button"
                [disabled]="isProcessing"
                (click)="onOpenApiKeyModal()"
                title="{{ isProcessing ? 'Không thể cấu hình khi đang xử lý' : (hasUserApiKey ? 'Sửa API Key của bạn' : 'Cấu hình API Key của bạn') }}"
                class="flex items-center gap-1 text-[11px] font-medium mt-0.5 transition-colors focus:outline-none text-left"
                [class.cursor-not-allowed]="isProcessing"
                [class.cursor-pointer]="!isProcessing"
                [ngClass]="hasUserApiKey ? 'text-emerald-600 hover:text-emerald-700' : (isProcessing ? 'text-slate-400' : 'text-slate-500 hover:text-indigo-600 underline decoration-slate-300 hover:decoration-indigo-600 underline-offset-2')"
              >
                <lucide-icon [img]="Key" class="w-3 h-3"></lucide-icon>
                <span>{{ hasUserApiKey ? 'Đang dùng key của bạn' : 'Nhập (cấu hình) API Key' }}</span>
              </button>
            </div>
          </div>

          <!-- Model Toggle -->
          <div class="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200" role="radiogroup" aria-label="Lựa chọn mô hình AI">
            <button 
              type="button"
              role="radio"
              [disabled]="isProcessing"
              [attr.aria-checked]="selectedModel === 'gemini-pro-latest'"
              (click)="onModelChange('gemini-pro-latest')"
              class="group relative flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium transition-all"
              [class.cursor-not-allowed]="isProcessing"
              [class.cursor-pointer]="!isProcessing"
              [class.opacity-60]="isProcessing && selectedModel !== 'gemini-pro-latest'"
              [ngClass]="selectedModel === 'gemini-pro-latest' ? 'bg-amber-50 text-amber-700 shadow-[0_0_12px_rgba(251,191,36,0.4)] ring-1 ring-amber-300/50' : (isProcessing ? 'text-slate-400' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50')"
            >
              <lucide-icon [img]="User" class="w-4 h-4"></lucide-icon>
              <span>Pro</span>
              <!-- Custom Tooltip for Pro -->
              <div class="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 w-56 sm:w-64 p-2.5 bg-slate-800 text-slate-100 text-xs text-center rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none border border-slate-700">
                <span class="font-semibold text-indigo-300">[Khuyên dùng]</span> - Sử dụng model AI tiên tiến nhất để dịch tài liệu chuyên ngành.
                <div class="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 border-t border-l border-slate-700 rotate-45 transform origin-center"></div>
              </div>
            </button>
            <button 
              type="button"
              role="radio"
              [disabled]="isProcessing"
              [attr.aria-checked]="selectedModel === 'gemini-flash-latest'"
              (click)="onModelChange('gemini-flash-latest')"
              class="group relative flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium transition-all"
              [class.cursor-not-allowed]="isProcessing"
              [class.cursor-pointer]="!isProcessing"
              [class.opacity-60]="isProcessing && selectedModel !== 'gemini-flash-latest'"
              [ngClass]="selectedModel === 'gemini-flash-latest' ? 'bg-amber-50 text-amber-700 shadow-[0_0_12px_rgba(251,191,36,0.4)] ring-1 ring-amber-300/50' : (isProcessing ? 'text-slate-400' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50')"
            >
              <lucide-icon [img]="Zap" class="w-4 h-4"></lucide-icon>
              <span>Flash</span>
              <!-- Custom Tooltip for Flash -->
              <div class="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 w-56 sm:w-64 p-2.5 bg-slate-800 text-slate-100 text-xs text-center rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none border border-slate-700">
                Model AI nhanh hơn và ngưỡng miễn phí rộng hơn. Thích hợp khi dịch nhiều & nội dung không phức tạp.
                <div class="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 border-t border-l border-slate-700 rotate-45 transform origin-center"></div>
              </div>
            </button>
          </div>


        </div>
        
        <app-search-bar [isProcessing]="isProcessing"></app-search-bar>
      </div>
    </header>
  `
})
export class HeaderControlsComponent {
  readonly FileText = FileText;
  readonly User = User;
  readonly Zap = Zap;
  readonly Key = Key;

  @Input() isProcessing = false;
  @Input() selectedModel = 'gemini-pro-latest';
  @Input() hasUserApiKey = false;
  
  @Output() modelChange = new EventEmitter<'gemini-pro-latest' | 'gemini-flash-latest'>();
  @Output() openApiKeyModal = new EventEmitter<void>();

  onModelChange(model: 'gemini-pro-latest' | 'gemini-flash-latest') {
    this.modelChange.emit(model);
  }

  onOpenApiKeyModal() {
    this.openApiKeyModal.emit();
  }
}
