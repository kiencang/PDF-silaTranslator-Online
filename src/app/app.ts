import { Component, ChangeDetectionStrategy, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { GeminiService } from './gemini.service';
import { LucideAngularModule, UploadCloud, FileText, Settings, Play, Download, CheckCircle2, AlertCircle, Loader2, ArrowDown, Maximize, Minimize, Clock, RefreshCw, Info, X } from 'lucide-angular';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

type TranslationMode = 'x_math' | 'x_svg' | 'normal' | 'phase1' | 'phase2';

interface Toast {
  id: number;
  type: 'error' | 'info' | 'success';
  message: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private geminiService = inject(GeminiService);
  private http = inject(HttpClient);

  // Icons
  readonly UploadCloud = UploadCloud;
  readonly FileText = FileText;
  readonly Settings = Settings;
  readonly Play = Play;
  readonly Download = Download;
  readonly CheckCircle2 = CheckCircle2;
  readonly AlertCircle = AlertCircle;
  readonly Loader2 = Loader2;
  readonly ArrowDown = ArrowDown;
  readonly RefreshCw = RefreshCw;
  readonly Maximize = Maximize;
  readonly Minimize = Minimize;
  readonly Clock = Clock;
  readonly Info = Info;
  readonly X = X;

  readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  readonly MAX_TOKENS = 25000;
  private promptCache = new Map<string, string>();

  // State
  selectedFile = signal<File | null>(null);
  fileBase64 = signal<string | null>(null);
  mimeType = signal<string>('');
  
  modeControl = new FormControl<TranslationMode>('x_svg', { nonNullable: true });
  temperatureControl = new FormControl<number>(0.3, { nonNullable: true });

  mode = signal<TranslationMode>('x_svg');
  temperature = signal<number>(0.3);
  
  isProcessing = signal<boolean>(false);
  progressMessage = signal<string>('');
  error = signal<string | null>(null);
  
  resultHtml = signal<string | null>(null);
  isDragging = signal<boolean>(false);
  tokenCount = signal<number>(0);
  isFullscreen = signal<boolean>(false);
  elapsedTime = signal<number>(0);
  private timerInterval: any;
  
  toasts = signal<Toast[]>([]);
  private toastIdCounter = 0;
  showResetConfirm = signal<boolean>(false);

  // Computed
  hasFile = computed(() => this.selectedFile() !== null);
  canProcess = computed(() => this.hasFile() && !this.isProcessing());
  tokenPercentage = computed(() => Math.min((this.tokenCount() / this.MAX_TOKENS) * 100, 100));
  formattedTime = computed(() => {
    const totalSeconds = this.elapsedTime();
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  });

  constructor() {
    this.modeControl.valueChanges.subscribe(val => this.mode.set(val));
    this.temperatureControl.valueChanges.subscribe(val => this.temperature.set(val));

    effect(() => {
      if (this.resultHtml()) {
        setTimeout(() => this.updateIframe(), 50);
      }
    });
  }

  showToast(type: 'error' | 'info' | 'success', message: string) {
    const id = this.toastIdCounter++;
    this.toasts.update(t => [...t, { id, type, message }]);
    setTimeout(() => {
      this.removeToast(id);
    }, 5000);
  }

  removeToast(id: number) {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDropOverride(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
         this.handleFile(file);
      } else if (file.type === 'text/html' || file.name.endsWith('.html')) {
         this.handleHtmlFile(file);
         this.modeControl.setValue('phase2');
         this.showToast('info', 'Đã tự động chuyển sang Phase 2 do phát hiện file HTML.');
      } else {
         this.showToast('error', 'Vui lòng tải lên tệp PDF hoặc HTML.');
      }
    }
  }

  onFileSelectedOverride(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type === 'application/pdf') {
         this.handleFile(file);
      } else if (file.type === 'text/html' || file.name.endsWith('.html')) {
         this.handleHtmlFile(file);
         this.modeControl.setValue('phase2');
         this.showToast('info', 'Đã tự động chuyển sang Phase 2 do phát hiện file HTML.');
      } else {
         this.showToast('error', 'Vui lòng tải lên tệp PDF hoặc HTML.');
      }
    }
    // Reset giá trị của input để cho phép chọn lại cùng một file
    input.value = '';
  }

  private handleFile(file: File) {
    if (file.type !== 'application/pdf') {
      this.showToast('error', 'Vui lòng tải lên tệp PDF.');
      this.selectedFile.set(null);
      this.fileBase64.set(null);
      return;
    }
    
    if (file.size > this.MAX_FILE_SIZE) { // 5MB limit
      this.showToast('error', 'Lỗi: Tệp tải lên vượt quá giới hạn 5MB.');
      this.selectedFile.set(null);
      this.fileBase64.set(null);
      return;
    }

    this.error.set(null);
    this.selectedFile.set(file);
    this.mimeType.set(file.type);
    this.resultHtml.set(null);

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      this.fileBase64.set(base64String);
      this.checkTokenLimit(base64String, file.type);
    };
    reader.readAsDataURL(file);
  }

  private handleHtmlFile(file: File) {
    if (file.size > this.MAX_FILE_SIZE) { // 5MB limit
      this.showToast('error', 'Lỗi: Tệp tải lên vượt quá giới hạn 5MB.');
      this.selectedFile.set(null);
      this.fileBase64.set(null);
      return;
    }

    this.error.set(null);
    this.selectedFile.set(file);
    this.mimeType.set(file.type);
    this.resultHtml.set(null);

    const reader = new FileReader();
    reader.onload = () => {
      const textContent = reader.result as string;
      this.fileBase64.set(textContent);
      this.checkTokenLimit(textContent, file.type);
    };
    reader.readAsText(file);
  }

  private async checkTokenLimit(base64String: string, mimeType: string) {
    try {
      const tokens = await this.geminiService.countTokens(base64String, mimeType);
      this.tokenCount.set(tokens);
      if (tokens > this.MAX_TOKENS) {
        this.showToast('error', `Lỗi: Nội dung vượt quá giới hạn 25.000 tokens (${tokens} tokens).`);
        this.selectedFile.set(null);
        this.fileBase64.set(null);
      }
    } catch (e) {
      console.error('Không thể đếm token', e);
      this.showToast('error', 'Lỗi khi kiểm tra dung lượng tài liệu. Vui lòng thử lại.');
    }
  }

  async loadPrompt(filename: string): Promise<string> {
    if (this.promptCache.has(filename)) {
      return this.promptCache.get(filename)!;
    }
    try {
      const content = await firstValueFrom(this.http.get(`/prompts/${filename}`, { responseType: 'text' }));
      this.promptCache.set(filename, content);
      return content;
    } catch (e) {
      console.error(`Không thể tải prompt ${filename}`, e);
      throw new Error(`Không thể tải system instruction: ${filename}`);
    }
  }

  async processFile() {
    if (!this.canProcess() || !this.fileBase64()) return;

    this.isProcessing.set(true);
    this.error.set(null);
    this.resultHtml.set(null);
    this.elapsedTime.set(0);
    
    this.timerInterval = setInterval(() => {
      this.elapsedTime.update(v => v + 1);
    }, 1000);

    try {
      const base64 = this.fileBase64()!;
      const mime = this.mimeType();
      const temp = this.temperature();
      const currentMode = this.mode();

      if (currentMode === 'x_math') {
        this.progressMessage.set('Dịch file PDF sang tiếng Việt (Tài liệu khoa học xã hội)...');
        const [instruction, prompt] = await Promise.all([
          this.loadPrompt('system_instructions_x_math.md'),
          this.loadPrompt('prompt_x_math.md')
        ]);
        const result = await this.geminiService.translate(base64, mime, prompt, instruction, temp);
        this.resultHtml.set(this.extractHtml(result));
      }
      else if (currentMode === 'x_svg') {
        this.progressMessage.set('Dịch file PDF sang tiếng Việt (Tài liệu khoa học nói chung)...');
        const [instruction, prompt] = await Promise.all([
          this.loadPrompt('system_instructions_x_svg.md'),
          this.loadPrompt('prompt_x_svg.md')
        ]);
        const result = await this.geminiService.translate(base64, mime, prompt, instruction, temp);
        this.resultHtml.set(this.extractHtml(result));
      }
      else if (currentMode === 'normal') {
        this.progressMessage.set('Dịch file PDF sang tiếng Việt (Tài liệu toán chuyên ngành)...');
        const [instruction, prompt] = await Promise.all([
          this.loadPrompt('system_instructions.md'),
          this.loadPrompt('prompt.md')
        ]);
        const result = await this.geminiService.translate(base64, mime, prompt, instruction, temp);
        this.resultHtml.set(this.extractHtml(result));
      }
      else if (currentMode === 'phase1') {
        this.progressMessage.set('Chuyển định dạng PDF sang HTML (English / Giữ nguyên nội dung)...');
        const [instruction, prompt] = await Promise.all([
          this.loadPrompt('system_instructions_phase_1.md'),
          this.loadPrompt('prompt_phase_1.md')
        ]);
        const result = await this.geminiService.translate(base64, mime, prompt, instruction, temp);
        this.resultHtml.set(this.extractHtml(result));
      }
      else if (currentMode === 'phase2') {
        if (this.selectedFile()?.type !== 'text/html') {
           throw new Error("Phase 2 cần đầu vào là định dạng HTML. Hãy tải file HTML lên.");
        }
        
        this.progressMessage.set('Dịch file HTML sang Tiếng Việt...');
        const [instruction, prompt] = await Promise.all([
          this.loadPrompt('system_instructions_phase_2.md'),
          this.loadPrompt('prompt_phase_2.md')
        ]);
        
        // base64 variable contains raw HTML text for phase 2
        const htmlContent = base64;
        const result = await this.geminiService.translateHtml(htmlContent, prompt, instruction, temp);
        this.resultHtml.set(this.extractHtml(result));
      }

      this.progressMessage.set('Done!');
      if (currentMode === 'phase1') {
        this.showToast('success', 'Quá trình chuyển đổi tài liệu hoàn tất!');
      } else {
        this.showToast('success', 'Quá trình dịch tài liệu hoàn tất!');
      }
    } catch (e: any) {
      console.error(e);
      const errorMessage = e.message || '';
      
      if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota')) {
        this.showToast('error', 'Lỗi: Hệ thống AI đang quá tải hoặc đã hết lượt sử dụng.');
      } 
      else if (errorMessage.includes('503') || errorMessage.toLowerCase().includes('overloaded')) {
        this.showToast('error', 'Lỗi: Máy chủ AI hiện đang bận. Vui lòng thử lại sau.');
      }
      else if (errorMessage.toLowerCase().includes('safety') || errorMessage.toLowerCase().includes('blocked')) {
        this.showToast('error', 'Lỗi: Tài liệu bị từ chối do nghi ngờ vi phạm chính sách an toàn.');
      }
      else {
        this.showToast('error', `Lỗi: ${errorMessage || 'Đã xảy ra lỗi kết nối với AI'}`);
      }
    } finally {
      this.isProcessing.set(false);
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
    }
  }

  private extractHtml(text: string): string {
    const match = text.match(/```[a-zA-Z]*\s*([\s\S]*?)\s*```/);
    if (match) {
      return match[1];
    }
    return text;
  }

  private updateIframe() {
    const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
    if (iframe && this.resultHtml()) {
      iframe.srcdoc = this.resultHtml()!;
    }
  }

  resetApp() {
    if (this.resultHtml()) {
      this.showResetConfirm.set(true);
    } else {
      this.confirmReset();
    }
  }

  confirmReset() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.selectedFile.set(null);
    this.fileBase64.set(null);
    this.resultHtml.set(null);
    this.error.set(null);
    this.tokenCount.set(0);
    this.progressMessage.set('');
    this.elapsedTime.set(0);
    this.isFullscreen.set(false);
    this.showResetConfirm.set(false);
    this.showToast('info', 'Đã làm mới phiên làm việc.');
  }

  cancelReset() {
    this.showResetConfirm.set(false);
  }

  downloadHtml() {
    if (this.resultHtml()) {
      const blob = new Blob([this.resultHtml()!], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const suffix = this.mode() === 'phase1' ? '_converted' : '_translated';
      a.download = `${this.selectedFile()?.name.replace(/\.[^/.]+$/, "") || 'document'}${suffix}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.showToast('success', 'Đã tải file HTML xuống máy.');
    }
  }
}
