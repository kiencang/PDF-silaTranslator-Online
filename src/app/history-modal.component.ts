import { Component, ChangeDetectionStrategy, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X, FileText, Trash2, Eye, Clock, AlertCircle } from 'lucide-angular';
import { TranslatedDoc } from './storage.service';

@Component({
  selector: 'app-history-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="history-title">
      <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-0 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[80vh]">
        
        <!-- Header -->
        <div class="p-5 border-b border-slate-100 bg-slate-50/50">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <lucide-icon [img]="Clock" class="w-4 h-4"></lucide-icon>
              </div>
              <h3 id="history-title" class="text-lg font-semibold text-slate-900">Lịch sử dịch gần đây</h3>
            </div>
            <button (click)="closeModal.emit()" class="text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors focus:outline-none rounded-full p-2 cursor-pointer shrink-0" aria-label="Đóng">
              <lucide-icon [img]="X" class="w-5 h-5" aria-hidden="true"></lucide-icon>
            </button>
          </div>
          <div class="mt-4 flex gap-2.5 bg-amber-50/70 border border-amber-100/60 rounded-xl p-3">
            <lucide-icon [img]="AlertCircle" class="w-4 h-4 text-amber-500 shrink-0 mt-0.5"></lucide-icon>
            <p class="text-xs tracking-wide text-amber-800/90 leading-relaxed">
              Danh sách 10 file gần nhất bạn dịch/chuyển đổi định dạng. Chúng được lưu cục bộ trên trình duyệt đang dùng để tiện xem lại. Hãy chủ động "Tải bản dịch" để lưu trữ lâu dài, danh sách này có thể bị mất nếu bạn xóa dữ liệu web.
            </p>
          </div>
        </div>

        <!-- Body -->
        <div class="p-6 overflow-y-auto space-y-4 flex-1 pb-8">
          @if (historyItems.length === 0) {
            <div class="flex flex-col items-center justify-center py-12 text-center">
              <div class="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
                <lucide-icon [img]="FileText" class="w-8 h-8"></lucide-icon>
              </div>
              <h4 class="text-base font-semibold text-slate-800 mb-1">Chưa có lịch sử dịch</h4>
              <p class="text-sm text-slate-500 max-w-sm">
                Các tài liệu bạn dịch thành công sẽ hiển thị ở đây để xem lại nhanh chóng bất cứ lúc nào.
              </p>
            </div>
          } @else {
            <div class="divide-y divide-slate-100">
              @for (item of historyItems; track item.id) {
                <div class="py-3.5 flex items-center justify-between gap-4 group hover:bg-slate-50/70 px-3 -mx-3 rounded-xl transition-all duration-150">
                  <button type="button" class="flex items-start text-left gap-3 flex-1 min-w-0 cursor-pointer focus:outline-none" (click)="selectItem.emit(item)">
                    <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <lucide-icon [img]="FileText" class="w-5 h-5"></lucide-icon>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="text-sm font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors" [title]="item.vietnameseTitle">
                        {{ item.vietnameseTitle }}
                      </div>
                      <div class="text-xs text-slate-500 truncate mt-0.5" [title]="item.originalFileName">
                        Tên tệp gốc: <span class="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded text-slate-600">{{ item.originalFileName }}</span>
                      </div>
                      <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span class="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full"
                              [ngClass]="{
                                'bg-emerald-50 text-emerald-700 border border-emerald-200/50': item.mode === 'zero_svg',
                                'bg-sky-50 text-sky-700 border border-sky-200/50': item.mode === 'zero_math',
                                'bg-indigo-50 text-indigo-700 border border-indigo-200/50': item.mode === 'normal',
                                'bg-amber-50 text-amber-700 border border-amber-200/50': item.mode === 'phase1',
                                'bg-pink-50 text-pink-700 border border-pink-200/50': item.mode === 'phase2'
                              }">
                          {{ getModeLabel(item.mode) }}
                        </span>
                        <span class="text-[11px] text-slate-400 flex items-center gap-1">
                          <lucide-icon [img]="Clock" class="w-3 h-3"></lucide-icon>
                          {{ formatDate(item.timestamp) }}
                        </span>
                      </div>
                    </div>
                  </button>

                  <!-- Actions -->
                  <div class="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    @if (deletingItemId === item.id) {
                      <div class="flex items-center gap-1 bg-red-50 rounded-lg p-1.5 border border-red-100 animate-in fade-in slide-in-from-right-4 duration-200">
                        <span class="text-xs text-red-600 font-medium px-1">Bạn muốn xóa?</span>
                        <button (click)="confirmDelete(item.id!, $event)" 
                                class="p-1 px-2 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded transition-colors cursor-pointer" 
                                title="Chắc chắn xóa">
                          Xóa
                        </button>
                        <button (click)="cancelDelete($event)" 
                                class="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors cursor-pointer focus:outline-none" 
                                title="Hủy">
                          <lucide-icon [img]="X" class="w-3 h-3"></lucide-icon>
                        </button>
                      </div>
                    } @else {
                      <button (click)="selectItem.emit(item)" 
                              class="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" 
                              title="Xem lại bản dịch">
                        <lucide-icon [img]="Eye" class="w-4 h-4"></lucide-icon>
                      </button>
                      <button (click)="onDeleteRequest(item.id!, $event)" 
                              class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" 
                              title="Xóa khỏi lịch sử">
                        <lucide-icon [img]="Trash2" class="w-4 h-4"></lucide-icon>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class HistoryModalComponent {
  readonly X = X;
  readonly FileText = FileText;
  readonly Trash2 = Trash2;
  readonly Eye = Eye;
  readonly Clock = Clock;
  readonly AlertCircle = AlertCircle;

  @Input() historyItems: TranslatedDoc[] = [];
  @Output() selectItem = new EventEmitter<TranslatedDoc>();
  @Output() deleteItem = new EventEmitter<number>();
  @Output() closeModal = new EventEmitter<void>();

  deletingItemId: number | null = null;

  getModeLabel(mode: string): string {
    switch (mode) {
      case 'zero_math': return 'KH Xã hội';
      case 'zero_svg': return 'KH tổng hợp';
      case 'normal': return 'Toán Chuyên Ngành';
      case 'phase1': return 'Cắt Lọc PDF (Phase 1)';
      case 'phase2': return 'Dịch HTML (Phase 2)';
      default: return mode;
    }
  }

  formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  }

  onDeleteRequest(id: number, event: MouseEvent) {
    event.stopPropagation();
    this.deletingItemId = id;
  }

  confirmDelete(id: number, event: MouseEvent) {
    event.stopPropagation();
    this.deleteItem.emit(id);
    this.deletingItemId = null;
  }

  cancelDelete(event: MouseEvent) {
    event.stopPropagation();
    this.deletingItemId = null;
  }
}
