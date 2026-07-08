import { Component, ChangeDetectionStrategy, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { LucideAngularModule, X } from 'lucide-angular';
import { TranslationMode } from './app';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-0 animate-in zoom-in-95 duration-200 overflow-hidden">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 id="settings-title" class="text-lg font-semibold text-slate-900">Thay đổi chế độ mặc định</h3>
          <button (click)="closeModal.emit()" class="text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors focus:outline-none rounded-full p-2 cursor-pointer" aria-label="Đóng cài đặt">
            <lucide-icon [img]="X" class="w-5 h-5" aria-hidden="true"></lucide-icon>
          </button>
        </div>
        <div class="p-6">
          <p class="text-slate-500 text-sm mb-5">
            Chế độ được chọn sẽ tự động áp dụng mỗi khi bạn tải lại trang. Cấu hình chỉ lưu tại trình duyệt bạn đang dùng.
          </p>
          <div class="space-y-3">
            <label class="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                   [class.border-indigo-600]="modeControl.value === 'zero_math'"
                   [class.bg-indigo-50]="modeControl.value === 'zero_math'">
              <input type="radio" value="zero_math" [formControl]="modeControl" class="text-indigo-600 focus:ring-indigo-600 mt-0.5">
              <span class="text-sm font-medium text-slate-900">Tài liệu khoa học xã hội</span>
            </label>
            <label class="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                   [class.border-indigo-600]="modeControl.value === 'zero_svg'"
                   [class.bg-indigo-50]="modeControl.value === 'zero_svg'">
              <input type="radio" value="zero_svg" [formControl]="modeControl" class="text-indigo-600 focus:ring-indigo-600 mt-0.5">
              <span class="text-sm font-medium text-slate-900">Tài liệu khoa học nói chung</span>
            </label>
            <label class="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                   [class.border-indigo-600]="modeControl.value === 'normal'"
                   [class.bg-indigo-50]="modeControl.value === 'normal'">
              <input type="radio" value="normal" [formControl]="modeControl" class="text-indigo-600 focus:ring-indigo-600 mt-0.5">
              <span class="text-sm font-medium text-slate-900">Tài liệu toán chuyên ngành</span>
            </label>
            <label class="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                   [class.border-indigo-600]="modeControl.value === 'phase1'"
                   [class.bg-indigo-50]="modeControl.value === 'phase1'">
              <input type="radio" value="phase1" [formControl]="modeControl" class="text-indigo-600 focus:ring-indigo-600 mt-0.5">
              <span class="text-sm font-medium text-slate-900">Dịch 2 giai đoạn</span>
            </label>
          </div>
        </div>
        <div class="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button (click)="closeModal.emit()" class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer">
            Hủy
          </button>
          <button (click)="onSave()" class="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm shadow-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer">
            Lưu cài đặt
          </button>
        </div>
      </div>
    </div>
  `
})
export class SettingsModalComponent {
  readonly X = X;

  @Input() set initialMode(mode: TranslationMode | null) {
    if (mode) {
      this.modeControl.setValue(mode);
    }
  }

  @Output() save = new EventEmitter<TranslationMode>();
  @Output() closeModal = new EventEmitter<void>();

  modeControl = new FormControl<TranslationMode>('zero_math', { nonNullable: true });

  onSave() {
    this.save.emit(this.modeControl.value);
  }
}
