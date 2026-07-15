import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, Settings, AlertCircle, ArrowDown, Loader2, Play } from 'lucide-angular';
import { TranslationMode } from './app';

@Component({
  selector: 'app-config-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bg-white rounded-2xl ring-1 ring-slate-900/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative transition-opacity duration-300"
             [class.opacity-50]="isProcessing" 
             [class.pointer-events-none]="isProcessing">
      <div class="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 rounded-t-2xl">
        <h2 class="text-sm font-semibold text-slate-900 uppercase tracking-wider">2. Cấu hình</h2>
        <div class="flex items-center gap-3 ml-auto">
          @if (modeControl.value !== 'phase1') {
            <label class="flex items-center gap-2 cursor-pointer group relative">
              <span class="text-xs font-medium transition-colors" [class.text-indigo-600]="useGoogleSearchControl.value" [class.text-slate-500]="!useGoogleSearchControl.value">+Search</span>
              <div class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2">
                <input type="checkbox" [formControl]="useGoogleSearchControl" class="peer sr-only">
                <div class="h-full w-full rounded-full transition-colors duration-200 ease-in-out" [class.bg-indigo-600]="useGoogleSearchControl.value" [class.bg-slate-200]="!useGoogleSearchControl.value"></div>
                <span class="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" [class.translate-x-4]="useGoogleSearchControl.value" [class.translate-x-0]="!useGoogleSearchControl.value"></span>
              </div>
              <!-- Tooltip -->
              <div class="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden w-[240px] group-hover:block z-50 pointer-events-none">
                <div class="bg-slate-800 text-white font-normal leading-relaxed text-xs rounded-lg py-2 px-3 shadow-xl relative text-left">
                  @if (useGoogleSearchControl.value) {
                    <span class="font-semibold text-emerald-400">[Đang Bật]</span>
                  } @else {
                    <span class="font-semibold text-slate-400">[Đang Tắt]</span>
                  }
                  Bổ sung công cụ tìm kiếm cho AI, giúp quá trình dịch tốt hơn. Tuy vậy sẽ tốn thời gian và token hơn. Tính năng này trên tài khoản miễn phí có thể bị hạn chế.
                  <div class="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800"></div>
                </div>
              </div>
            </label>
          }
          <button (click)="openSettings.emit()" class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer" title="Thay đổi chế độ mặc định">
            <lucide-icon [img]="Settings" class="w-4.5 h-4.5" aria-hidden="true"></lucide-icon>
          </button>
        </div>
      </div>
      <div class="p-6 space-y-5">
        
        <!-- Mode Selection -->
        <div class="space-y-3">
          <div class="block text-sm font-medium text-slate-700" id="mode-group-label">Chế độ dịch</div>
          <fieldset class="space-y-2" aria-labelledby="mode-group-label">
            <legend class="sr-only">Chọn chế độ dịch</legend>
            <label class="flex items-start gap-3 p-3 border rounded-xl transition-colors"
                   [class.cursor-pointer]="!isHtmlUploaded"
                   [class.cursor-not-allowed]="isHtmlUploaded"
                   [class.opacity-50]="isHtmlUploaded"
                   [class.bg-slate-50]="isHtmlUploaded"
                   [class.hover:bg-slate-50]="!isHtmlUploaded"
                   [class.border-indigo-600]="modeControl.value === 'zero_math'"
                   [class.bg-indigo-50]="modeControl.value === 'zero_math'">
              <input type="radio" name="mode" value="zero_math" [formControl]="modeControl" [attr.disabled]="isHtmlUploaded ? true : null" class="mt-1 text-indigo-600 focus:ring-indigo-600 disabled:opacity-50" aria-describedby="desc-zero-math">
              <div>
                <div class="text-sm font-medium text-slate-900">Tài liệu khoa học xã hội</div>
                <div id="desc-zero-math" class="text-xs text-slate-600 mt-0.5">PDF -> HTML (VI). <strong>Không công thức toán. Không đồ thị toán</strong>.</div>
                @if (isHtmlUploaded) {
                  <div class="text-[11px] font-medium text-amber-600 mt-1 flex items-center gap-1"><lucide-icon [img]="AlertCircle" class="w-3.5 h-3.5"></lucide-icon> Chỉ hỗ trợ file PDF</div>
                }
              </div>
            </label>

            <label class="flex items-start gap-3 p-3 border rounded-xl transition-colors"
                   [class.cursor-pointer]="!isHtmlUploaded"
                   [class.cursor-not-allowed]="isHtmlUploaded"
                   [class.opacity-50]="isHtmlUploaded"
                   [class.bg-slate-50]="isHtmlUploaded"
                   [class.hover:bg-slate-50]="!isHtmlUploaded"
                   [class.border-indigo-600]="modeControl.value === 'zero_svg'"
                   [class.bg-indigo-50]="modeControl.value === 'zero_svg'">
              <input type="radio" name="mode" value="zero_svg" [formControl]="modeControl" [attr.disabled]="isHtmlUploaded ? true : null" class="mt-1 text-indigo-600 focus:ring-indigo-600 disabled:opacity-50" aria-describedby="desc-zero-svg">
              <div>
                <div class="text-sm font-medium text-slate-900">Tài liệu khoa học nói chung</div>
                <div id="desc-zero-svg" class="text-xs text-slate-600 mt-0.5">PDF -> HTML (VI). Có công thức toán nhưng không gồm đồ thị toán phức tạp. <strong>Đa phần các tài liệu khoa học nên chọn tùy chọn này</strong>.</div>
                @if (isHtmlUploaded) {
                  <div class="text-[11px] font-medium text-amber-600 mt-1 flex items-center gap-1"><lucide-icon [img]="AlertCircle" class="w-3.5 h-3.5"></lucide-icon> Chỉ hỗ trợ file PDF</div>
                }
              </div>
            </label>

            <label class="flex items-start gap-3 p-3 border rounded-xl transition-colors"
                   [class.cursor-pointer]="!isHtmlUploaded"
                   [class.cursor-not-allowed]="isHtmlUploaded"
                   [class.opacity-50]="isHtmlUploaded"
                   [class.bg-slate-50]="isHtmlUploaded"
                   [class.hover:bg-slate-50]="!isHtmlUploaded"
                   [class.border-indigo-600]="modeControl.value === 'normal'"
                   [class.bg-indigo-50]="modeControl.value === 'normal'">
              <input type="radio" name="mode" value="normal" [formControl]="modeControl" [attr.disabled]="isHtmlUploaded ? true : null" class="mt-1 text-indigo-600 focus:ring-indigo-600 disabled:opacity-50" aria-describedby="desc-normal">
              <div>
                <div class="text-sm font-medium text-slate-900">Tài liệu toán chuyên ngành</div>
                <div id="desc-normal" class="text-xs text-slate-600 mt-0.5">PDF -> HTML (VI). Có công thức toán và cả đồ thị toán.</div>
                @if (isHtmlUploaded) {
                  <div class="text-[11px] font-medium text-amber-600 mt-1 flex items-center gap-1"><lucide-icon [img]="AlertCircle" class="w-3.5 h-3.5"></lucide-icon> Chỉ hỗ trợ file PDF</div>
                }
              </div>
            </label>                

            <div class="relative border rounded-xl transition-colors duration-200"
                 [class.hover:bg-slate-50]="!isTwoPhaseMode"
                 [class.bg-indigo-50]="isTwoPhaseMode"
                 [class.border-indigo-600]="isTwoPhaseMode">
              
              <label class="flex items-start gap-3 p-3 cursor-pointer"
                     (click)="selectTwoPhaseMode()"
                     (keydown.enter)="selectTwoPhaseMode()"
                     tabindex="0">
                <input type="radio" name="main_mode" [checked]="isTwoPhaseMode" class="mt-1 text-indigo-600 focus:ring-indigo-600" aria-describedby="desc-two-phase" tabindex="-1">
                <div>
                  <div class="text-sm font-medium text-slate-900">Dịch 2 giai đoạn (cho tài liệu bố cục phức tạp)</div>
                  <div id="desc-two-phase" class="text-xs text-slate-600 mt-0.5">Chia quá trình dịch thành 2 bước (phase). <strong>Áp dụng được với mọi kiểu tài liệu. Chất lượng dịch có thể tốt hơn</strong>, nhưng tốn thời gian &amp; token hơn đáng kể (gấp đôi).</div>
                </div>
              </label>

              @if (isTwoPhaseMode) {
                <div class="p-3 pt-0 pl-11 space-y-2">
                  <label class="flex items-start gap-3 p-3 border rounded-xl transition-colors bg-white"
                         [class.cursor-pointer]="!isHtmlUploaded"
                         [class.cursor-not-allowed]="isHtmlUploaded"
                         [class.opacity-50]="isHtmlUploaded"
                         [class.bg-slate-50]="isHtmlUploaded"
                         [class.hover:bg-slate-50]="!isHtmlUploaded"
                         [class.border-indigo-600]="modeControl.value === 'phase1'"
                         [class.ring-1]="modeControl.value === 'phase1'"
                         [class.ring-indigo-600]="modeControl.value === 'phase1'">
                    <input type="radio" name="mode" value="phase1" [formControl]="modeControl" [attr.disabled]="isHtmlUploaded ? true : null" class="mt-1 text-indigo-600 focus:ring-indigo-600 disabled:opacity-50" aria-describedby="desc-phase1">
                    <div>
                      <div class="text-sm font-medium text-slate-900">Phase 1: PDF sang HTML (EN)</div>
                      <div id="desc-phase1" class="text-xs text-slate-600 mt-0.5">Trích layout và nội dung tiếng Anh.</div>
                      @if (isHtmlUploaded) {
                        <div class="text-[11px] font-medium text-amber-600 mt-1 flex items-center gap-1"><lucide-icon [img]="AlertCircle" class="w-3.5 h-3.5"></lucide-icon> Chỉ hỗ trợ file PDF</div>
                      }
                    </div>
                  </label>

                  <div class="flex justify-center">
                    <lucide-icon [img]="ArrowDown" class="w-5 h-5 text-slate-500" aria-hidden="true"></lucide-icon>
                  </div>

                  <label class="flex items-start gap-3 p-3 border rounded-xl transition-colors bg-white"
                         [class.cursor-pointer]="!isPdfUploaded"
                         [class.cursor-not-allowed]="isPdfUploaded"
                         [class.opacity-50]="isPdfUploaded"
                         [class.bg-slate-50]="isPdfUploaded"
                         [class.hover:bg-slate-50]="!isPdfUploaded"
                         [class.border-indigo-600]="modeControl.value === 'phase2'"
                         [class.ring-1]="modeControl.value === 'phase2'"
                         [class.ring-indigo-600]="modeControl.value === 'phase2'">
                    <input type="radio" name="mode" value="phase2" [formControl]="modeControl" [attr.disabled]="isPdfUploaded ? true : null" class="mt-1 text-indigo-600 focus:ring-indigo-600 disabled:opacity-50" aria-describedby="desc-phase2">
                    <div>
                      <div class="text-sm font-medium text-slate-900">Phase 2: HTML (EN) sang HTML (VI)</div>
                      <div id="desc-phase2" class="text-xs text-slate-600 mt-0.5">Yêu cầu tải lên file HTML có được từ Phase 1.</div>
                      @if (isPdfUploaded) {
                        <div class="text-[11px] font-medium text-amber-600 mt-1 flex items-center gap-1"><lucide-icon [img]="AlertCircle" class="w-3.5 h-3.5"></lucide-icon> Chỉ hỗ trợ file HTML</div>
                      }
                    </div>
                  </label>
                </div>
              }
            </div>
          </fieldset>
        </div>

        <!-- Action Button -->
        <button 
          (click)="processFile.emit()"
          [disabled]="!canProcess || hasResultHtml"
          class="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed cursor-pointer text-white rounded-2xl font-medium flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          @if (isProcessing) {
            <lucide-icon [img]="Loader2" class="w-5 h-5 animate-spin" aria-hidden="true"></lucide-icon>
            <span>Đang xử lý...</span>
          } @else {
            <lucide-icon [img]="Play" class="w-5 h-5" aria-hidden="true"></lucide-icon>
            <span>Bắt đầu ngay</span>
          }
        </button>

        @if (isProcessing) {
          <p class="text-center text-sm text-indigo-600 font-medium animate-pulse" aria-live="polite">
            {{ progressMessage }}
          </p>
        }
      </div>
    </section>
  `
})
export class ConfigSectionComponent {
  readonly Settings = Settings;
  readonly AlertCircle = AlertCircle;
  readonly ArrowDown = ArrowDown;
  readonly Loader2 = Loader2;
  readonly Play = Play;

  @Input() modeControl!: FormControl<TranslationMode>;
  @Input() useGoogleSearchControl!: FormControl<boolean>;
  @Input() isHtmlUploaded = false;
  @Input() isPdfUploaded = false;
  @Input() isTwoPhaseMode = false;
  @Input() isProcessing = false;
  @Input() canProcess = false;
  @Input() hasResultHtml = false;
  @Input() progressMessage = '';

  @Output() openSettings = new EventEmitter<void>();
  @Output() processFile = new EventEmitter<void>();

  selectTwoPhaseMode() {
    if (!this.isTwoPhaseMode) {
      this.modeControl.setValue(this.isHtmlUploaded ? 'phase2' : 'phase1');
    }
  }
}
