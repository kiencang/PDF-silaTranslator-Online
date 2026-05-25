import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, RefreshCw, UploadCloud, CheckCircle2, Scissors, Loader2, FileEdit, AlertCircle, Clock } from 'lucide-angular';

@Component({
  selector: 'app-upload-zone',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DecimalPipe],
  template: `
    <section class="bg-white rounded-2xl ring-1 ring-slate-900/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden" [class.opacity-50]="isProcessing" [class.pointer-events-none]="isProcessing">
      <div class="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h2 class="text-sm font-semibold text-slate-900 uppercase tracking-wider">1. Tải lên tài liệu cần dịch</h2>
        @if (hasFile || hasResult) {
          <button (click)="resetApp.emit()" class="text-xs flex items-center gap-1.5 text-slate-600 bg-white border border-slate-200 shadow-sm hover:text-indigo-600 hover:border-indigo-200 transition-colors px-2.5 py-1.5 rounded-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
            <lucide-icon [img]="RefreshCw" class="w-3.5 h-3.5" aria-hidden="true"></lucide-icon> Làm mới
          </button>
        }
      </div>
      <div class="p-6">
        <div 
          [attr.role]="!hasFile ? 'button' : null"
          [attr.tabindex]="!hasFile ? '0' : null"
          [attr.aria-label]="!hasFile ? 'Khu vực tải lên tài liệu. Nhấn Enter hoặc Space để chọn file' : null"
          class="relative border-2 rounded-xl p-8 text-center transition-all duration-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2"
          [class.cursor-pointer]="!hasFile"
          [class.border-dashed]="!isDragging()"
          [class.border-solid]="isDragging()"
          [class.border-slate-300]="!isDragging()"
          [class.border-indigo-500]="isDragging()"
          [class.bg-slate-50]="!isDragging()"
          [class.hover:bg-slate-100]="!hasFile && !isDragging()"
          [class.bg-indigo-50]="isDragging()"
          [class.scale-[1.02]]="isDragging()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          (click)="!hasFile ? fileInput.click() : null"
          (keydown.enter)="!hasFile ? fileInput.click() : null"
          (keydown.space)="!hasFile ? fileInput.click() : null; !hasFile ? $event.preventDefault() : null"
        >
          <input 
            type="file" 
            #fileInput 
            class="hidden"
            accept="application/pdf,text/html" 
            (change)="onFileSelected($event, fileInput)"
            [disabled]="isProcessing"
            title="Click để tải tài liệu lên"
          >
          
          @if (!hasFile) {
            <div class="flex flex-col items-center gap-3">
              <div class="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                <lucide-icon [img]="UploadCloud" class="w-6 h-6" aria-hidden="true"></lucide-icon>
              </div>
              <div class="text-center">
                <p class="text-sm font-medium text-slate-900">
                  <span class="block">Click vào để tải tài liệu lên</span>
                  <span class="block my-0.5">hoặc</span>
                  <span class="block">Kéo thả vào đây</span>
                </p>
                <p class="text-xs text-slate-600 mt-2">
                  <span class="block">PDF (max 25 trang / 10MB / 25K token)</span>
                  <span class="block">HTML (max 0.5 MB / 35K token)</span>
                </p>
              </div>
            </div>
          } @else if (isHistoryView) {
            <div class="flex flex-col items-center gap-3 w-full">
              <div class="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                <lucide-icon [img]="Clock" class="w-6 h-6" aria-hidden="true"></lucide-icon>
              </div>
              <div class="text-center w-full px-2">
                <span class="text-[10px] font-semibold text-indigo-700 bg-indigo-100/60 uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block mb-1.5 border border-indigo-150">
                  Đang xem lịch sử dịch
                </span>
                <p class="text-xs font-semibold text-slate-800 break-all max-w-[260px] mx-auto leading-relaxed" title="{{ selectedFile?.name }}">
                  {{ selectedFile?.name }}
                </p>
              </div>

              <button class="inline-flex items-center gap-1.5 px-3 py-1.5 mt-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 shadow-sm rounded-lg transition-all cursor-pointer" (click)="fileInput.click(); $event.stopPropagation()">
                <lucide-icon [img]="UploadCloud" class="w-3.5 h-3.5" aria-hidden="true"></lucide-icon>
                Tải tệp mới lên
              </button>
            </div>
          } @else {
            <div class="flex flex-col items-center gap-3 w-full">
              <div class="p-3 bg-emerald-50 text-emerald-600 rounded-full">
                <lucide-icon [img]="CheckCircle2" class="w-6 h-6" aria-hidden="true"></lucide-icon>
              </div>
              <div class="text-center w-full">
                <p class="text-sm font-medium text-slate-900 truncate max-w-[200px] mx-auto">{{ selectedFile?.name }}</p>
                @if (selectedFile) {
                  <p class="text-xs text-slate-600 mt-1">{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</p>
                }
              </div>

              @if (selectedFile?.type === 'application/pdf' && pdfTotalPages > 0) {
                <div class="w-full max-w-[240px] mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()" tabindex="0">
                  <div class="flex items-center gap-1.5 mb-2 text-slate-700">
                    <lucide-icon [img]="Scissors" class="w-3.5 h-3.5" aria-hidden="true"></lucide-icon>
                    <span class="text-xs font-medium">Cắt trang (Tổng: {{ pdfTotalPages }})</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="flex-1 relative">
                      <span class="absolute inset-y-0 left-2 flex items-center text-[10px] text-slate-500 font-medium">Từ</span>
                      <input type="number" [ngModel]="pdfStartPage" (ngModelChange)="onStartPageChange($event)" min="1" [max]="pdfTotalPages" class="w-full pl-6 pr-1 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-center">
                    </div>
                    <span class="text-slate-400 text-xs">-</span>
                    <div class="flex-1 relative">
                      <span class="absolute inset-y-0 left-2 flex items-center text-[10px] text-slate-500 font-medium">Đến</span>
                      <input type="number" [ngModel]="pdfEndPage" (ngModelChange)="onEndPageChange($event)" min="1" [max]="pdfTotalPages" class="w-full pl-8 pr-1 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-center">
                    </div>
                  </div>
                </div>
              }
              
              @if (tokenCount > 0 || isCountingTokens) {
                <div class="w-full max-w-[240px] mt-2">
                  <div class="flex justify-between items-center text-[10px] uppercase tracking-wider font-semibold mb-1.5">
                    <span class="text-slate-600 flex items-center gap-1">
                      Token Usage
                      @if (isCountingTokens) {
                        <lucide-icon [img]="Loader2" class="w-3 h-3 animate-spin text-indigo-500"></lucide-icon>
                      }
                    </span>
                    @if (!isCountingTokens) {
                      <span [class.text-emerald-600]="tokenCount < currentMaxTokens * 0.8" [class.text-amber-500]="tokenCount >= currentMaxTokens * 0.8 && tokenCount <= currentMaxTokens" [class.text-red-600]="tokenCount > currentMaxTokens">
                        {{ tokenCount | number }} / {{ currentMaxTokens / 1000 }}K
                      </span>
                    }
                  </div>
                  <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div class="h-1.5 rounded-full transition-all duration-700 ease-out"
                         [style.width.%]="tokenPercentage"
                         [class.bg-emerald-500]="tokenCount < currentMaxTokens * 0.8"
                         [class.bg-amber-500]="tokenCount >= currentMaxTokens * 0.8 && tokenCount <= currentMaxTokens"
                         [class.bg-red-500]="tokenCount > currentMaxTokens"></div>
                  </div>
                </div>
              }

              <button class="inline-flex items-center gap-1.5 px-3 py-1.5 mt-2 text-xs font-medium text-slate-600 bg-transparent border border-slate-300 hover:bg-white hover:text-slate-900 hover:shadow-sm rounded-md transition-all cursor-pointer" (click)="fileInput.click(); $event.stopPropagation()">
                <lucide-icon [img]="FileEdit" class="w-3.5 h-3.5" aria-hidden="true"></lucide-icon>
                Chọn file khác
              </button>
            </div>
          }
        </div>

        @if (error) {
          <div class="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2" role="alert" aria-live="assertive">
            <lucide-icon [img]="AlertCircle" class="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true"></lucide-icon>
            <span>{{ error }}</span>
          </div>
        }
      </div>
    </section>
  `
})
export class UploadZoneComponent {
  readonly RefreshCw = RefreshCw;
  readonly UploadCloud = UploadCloud;
  readonly CheckCircle2 = CheckCircle2;
  readonly Scissors = Scissors;
  readonly Loader2 = Loader2;
  readonly FileEdit = FileEdit;
  readonly AlertCircle = AlertCircle;
  readonly Clock = Clock;

  @Input() isProcessing = false;
  @Input() hasFile = false;
  @Input() isHistoryView = false;
  @Input() hasResult = false;
  @Input() selectedFile: File | null = null;
  @Input() pdfTotalPages = 0;
  @Input() pdfStartPage = 0;
  @Input() pdfEndPage = 0;
  @Input() tokenCount = 0;
  @Input() isCountingTokens = false;
  @Input() currentMaxTokens = 0;
  @Input() tokenPercentage = 0;
  @Input() error: string | null = null;

  @Output() fileChange = new EventEmitter<File>();
  @Output() pageChange = new EventEmitter<{ start: number; end: number }>();
  @Output() resetApp = new EventEmitter<void>();

  isDragging = signal<boolean>(false);

  onDragOver(event: DragEvent) {
    if (this.isProcessing) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    if (this.isProcessing) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    if (this.isProcessing) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.fileChange.emit(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event, fileInput: HTMLInputElement) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.fileChange.emit(input.files[0]);
    }
    fileInput.value = ''; // Reset
  }

  onStartPageChange(val: number) {
    this.pageChange.emit({ start: val, end: this.pdfEndPage });
  }

  onEndPageChange(val: number) {
    this.pageChange.emit({ start: this.pdfStartPage, end: val });
  }
}
