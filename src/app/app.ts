import { Component, ChangeDetectionStrategy, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from './gemini.service';
import { LucideAngularModule, UploadCloud, FileText, Settings, Play, Download, CheckCircle2, AlertCircle, Loader2, Copy, Eye, Code, ArrowDown } from 'lucide-angular';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

type TranslationMode = 'x_math' | 'x_svg' | 'normal' | 'phase1' | 'phase2';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
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
  readonly Copy = Copy;
  readonly Eye = Eye;
  readonly Code = Code;
  readonly ArrowDown = ArrowDown;

  // State
  selectedFile = signal<File | null>(null);
  fileBase64 = signal<string | null>(null);
  mimeType = signal<string>('');
  
  mode = signal<TranslationMode>('x_svg');
  temperature = signal<number>(0.3);
  
  isProcessing = signal<boolean>(false);
  progressMessage = signal<string>('');
  error = signal<string | null>(null);
  
  resultHtml = signal<string | null>(null);
  viewMode = signal<'preview' | 'code'>('preview');

  // Computed
  hasFile = computed(() => this.selectedFile() !== null);
  canProcess = computed(() => this.hasFile() && !this.isProcessing());

  constructor() {
    effect(() => {
      if (this.resultHtml() && this.viewMode() === 'preview') {
        setTimeout(() => this.updateIframe(), 50);
      }
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const dropzone = event.currentTarget as HTMLElement;
    dropzone.classList.add('border-indigo-500', 'bg-indigo-50');
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const dropzone = event.currentTarget as HTMLElement;
    dropzone.classList.remove('border-indigo-500', 'bg-indigo-50');
  }

  onDropOverride(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const dropzone = event.currentTarget as HTMLElement;
    dropzone.classList.remove('border-indigo-500', 'bg-indigo-50');

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
         this.handleFile(file);
      } else if (file.type === 'text/html') {
         this.handleHtmlFile(file);
         this.mode.set('phase2'); // Auto-switch mode
      } else {
         this.error.set('Vui lòng tải lên tệp PDF hoặc HTML.');
      }
    }
  }

  onFileSelectedOverride(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type === 'application/pdf') {
         this.handleFile(file);
      } else if (file.type === 'text/html') {
         this.handleHtmlFile(file);
         this.mode.set('phase2'); // Auto-switch mode
      } else {
         this.error.set('Vui lòng tải lên tệp PDF hoặc HTML.');
      }
    }
  }

  private handleFile(file: File) {
    if (file.type !== 'application/pdf') {
      this.error.set('Vui lòng tải lên tệp PDF.');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      this.error.set('Tệp tin quá lớn. Vui lòng tải lên tệp tin có dung lượng nhỏ hơn 5MB.');
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
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      this.error.set('Tệp tin quá lớn. Vui lòng tải lên tệp tin có dung lượng nhỏ hơn 5MB.');
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
      if (tokens > 25000) {
        this.error.set(`Warning: Tài liệu quá lớn (${tokens} tokens). Lượng tokens tối đa của file đầu vào được phép là 25,000 tokens.`);
        this.selectedFile.set(null);
        this.fileBase64.set(null);
      }
    } catch (e) {
      console.error('Không thể đếm token', e);
      this.error.set('Lỗi khi kiểm tra dung lượng tài liệu. Vui lòng kiểm tra kết nối mạng và thử lại.');
    }
  }

  async loadPrompt(filename: string): Promise<string> {
    try {
      return await firstValueFrom(this.http.get(`/prompts/${filename}`, { responseType: 'text' }));
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

    try {
      const base64 = this.fileBase64()!;
      const mime = this.mimeType();
      const temp = this.temperature();
      const currentMode = this.mode();

      if (currentMode === 'x_math') {
        this.progressMessage.set('Dịch PDF sang HTML (Không công thức toán / Không biểu đồ toán)...');
        const instruction = await this.loadPrompt('system_instructions_x_math.md');
        const prompt = await this.loadPrompt('prompt_x_math.md');
        const result = await this.geminiService.translate(base64, mime, prompt, instruction, temp);
        this.resultHtml.set(this.extractHtml(result));
      }
      else if (currentMode === 'x_svg') {
        this.progressMessage.set('Dịch PDF sang HTML (Có công thức toán học / Không biểu đồ toán)...');
        const instruction = await this.loadPrompt('system_instructions_x_svg.md');
        const prompt = await this.loadPrompt('prompt_x_svg.md');
        const result = await this.geminiService.translate(base64, mime, prompt, instruction, temp);
        this.resultHtml.set(this.extractHtml(result));
      }
      else if (currentMode === 'normal') {
        this.progressMessage.set('Dịch PDF sang HTML (Có công thức toán học / Có biểu đồ toán)...');
        const instruction = await this.loadPrompt('system_instructions.md');
        const prompt = await this.loadPrompt('prompt.md');
        const result = await this.geminiService.translate(base64, mime, prompt, instruction, temp);
        this.resultHtml.set(this.extractHtml(result));
      }
      else if (currentMode === 'phase1') {
        this.progressMessage.set('Chuyển PDF sang HTML (English)...');
        const instruction = await this.loadPrompt('system_instructions_phase_1.md');
        const prompt = await this.loadPrompt('prompt_phase_1.md');
        const result = await this.geminiService.translate(base64, mime, prompt, instruction, temp);
        this.resultHtml.set(this.extractHtml(result));
      }
      else if (currentMode === 'phase2') {
        if (this.selectedFile()?.type !== 'text/html') {
           throw new Error("Phase 2 cần đầu vào là định dạng HTML. Hãy tải file HTML lên.");
        }
        
        this.progressMessage.set('Dịch HTML sang Tiếng Việt...');
        const instruction = await this.loadPrompt('system_instructions_phase_2.md');
        const prompt = await this.loadPrompt('prompt_phase_2.md');
        
        // base64 variable contains raw HTML text for phase 2
        const htmlContent = base64;
        const result = await this.geminiService.translateHtml(htmlContent, prompt, instruction, temp);
        this.resultHtml.set(this.extractHtml(result));
      }

      this.progressMessage.set('Done!');
    } catch (e: any) {
      console.error(e);
      this.error.set(e.message || 'Đã xảy ra lỗi trong quá trình xử lý.');
    } finally {
      this.isProcessing.set(false);
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

  copyToClipboard() {
    if (this.resultHtml()) {
      navigator.clipboard.writeText(this.resultHtml()!);
    }
  }

  downloadHtml() {
    if (this.resultHtml()) {
      const blob = new Blob([this.resultHtml()!], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.selectedFile()?.name.replace(/\.[^/.]+$/, "") || 'document'}_translated.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }
}
