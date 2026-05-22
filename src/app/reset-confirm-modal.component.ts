import { Component, ChangeDetectionStrategy, EventEmitter, Output, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, AlertCircle } from 'lucide-angular';

@Component({
  selector: 'app-reset-confirm-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-desc">
      <div class="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
        <div class="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4 mx-auto">
          <lucide-icon [img]="AlertCircle" class="w-6 h-6" aria-hidden="true"></lucide-icon>
        </div>
        <h3 id="modal-title" class="text-lg font-semibold text-slate-900 text-center mb-2">Xác nhận làm mới</h3>
        <p id="modal-desc" class="text-slate-500 text-sm text-center mb-6">
          Bạn có chắc chắn muốn xóa kết quả hiện tại không? Dữ liệu chưa lưu sẽ bị mất.
        </p>
        <div class="flex gap-3">
          <button #cancelResetBtn (click)="cancelConfirm.emit()" class="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer">
            Hủy bỏ
          </button>
          <button (click)="confirm.emit()" class="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
            Đồng ý
          </button>
        </div>
      </div>
    </div>
  `
})
export class ResetConfirmModalComponent implements AfterViewInit {
  readonly AlertCircle = AlertCircle;
  @ViewChild('cancelResetBtn') cancelResetBtn?: ElementRef<HTMLButtonElement>;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancelConfirm = new EventEmitter<void>();

  ngAfterViewInit() {
    setTimeout(() => {
      this.cancelResetBtn?.nativeElement?.focus();
    }, 50);
  }
}
