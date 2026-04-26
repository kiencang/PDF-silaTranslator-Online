import { Component, ChangeDetectionStrategy, signal, inject, computed, effect, ViewChild, ElementRef, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { GeminiService } from './gemini.service';
import { LucideAngularModule, UploadCloud, FileText, Settings, Play, Download, CheckCircle2, AlertCircle, Loader2, ArrowDown, Maximize, Minimize, Clock, RefreshCw, Info, X, Search, ExternalLink, Scissors, FileEdit } from 'lucide-angular';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PDFDocument } from 'pdf-lib';

type TranslationMode = 'zero_math' | 'zero_svg' | 'normal' | 'phase1' | 'phase2';

interface Toast {
  id: number;
  type: 'error' | 'info' | 'success';
  message: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, LucideAngularModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private geminiService = inject(GeminiService);
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);

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
  readonly Search = Search;
  readonly ExternalLink = ExternalLink;
  readonly Scissors = Scissors;
  readonly FileEdit = FileEdit;

  readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  readonly MAX_FILE_SIZE_HTML = 0.5 * 1024 * 1024; // 500KB
  readonly MAX_PDF_TOKENS = 25000;
  readonly MAX_HTML_TOKENS = 35000;
  private promptCache = new Map<string, string>();

  // State
  selectedFile = signal<File | null>(null);
  fileBase64 = signal<string | null>(null);
  mimeType = signal<string>('');
  
  modeControl = new FormControl<TranslationMode>('zero_svg', { nonNullable: true });
  defaultModeControl = new FormControl<TranslationMode>('zero_svg', { nonNullable: true });
  temperatureControl = new FormControl<number>(0.3, { nonNullable: true });
  useGoogleSearchControl = new FormControl<boolean>(false, { nonNullable: true });
  showSettingsModal = signal<boolean>(false);

  mode = signal<TranslationMode>('zero_svg');
  isTwoPhaseMode = computed(() => this.mode() === 'phase1' || this.mode() === 'phase2');
  temperature = signal<number>(0.3);
  useGoogleSearch = signal<boolean>(false);
  
  isProcessing = signal<boolean>(false);
  progressMessage = signal<string>('');
  error = signal<string | null>(null);
  
  resultHtml = signal<string | null>(null);
  isDragging = signal<boolean>(false);
  tokenCount = signal<number>(0);
  isCountingTokens = signal<boolean>(false);
  
  // PDF Cropping State
  pdfTotalPages = signal<number>(0);
  pdfStartPage = signal<number>(1);
  pdfEndPage = signal<number>(1);
  croppedFile = signal<File | null>(null);
  private cropTimeout: ReturnType<typeof setTimeout> | undefined;

  isFullscreen = signal<boolean>(false);
  elapsedTime = signal<number>(0);
  private timerInterval: ReturnType<typeof setInterval> | undefined;
  
  toasts = signal<Toast[]>([]);
  private toastIdCounter = 0;
  private toastTimeouts = new Set<ReturnType<typeof setTimeout>>();
  showResetConfirm = signal<boolean>(false);
  // Search State
  isSearching = signal<boolean>(false);
  translatedQuery = signal<string>('');
  searchQuery = signal<string>('');

  @ViewChild('cancelResetBtn') cancelResetBtn?: ElementRef<HTMLButtonElement>;
  @ViewChild('resetBtn') resetBtn?: ElementRef<HTMLButtonElement>;
  @ViewChild('previewIframe') previewIframe?: ElementRef<HTMLIFrameElement>;

  // Computed
  isPdfUploaded = computed(() => this.mimeType() === 'application/pdf');
  isHtmlUploaded = computed(() => this.mimeType() === 'text/html');
  currentMaxTokens = computed(() => this.mimeType() === 'text/html' ? this.MAX_HTML_TOKENS : this.MAX_PDF_TOKENS);
  hasFile = computed(() => this.selectedFile() !== null);
  canProcess = computed(() => this.hasFile() && !this.isProcessing() && !this.isCountingTokens() && this.tokenCount() <= this.currentMaxTokens());
  tokenPercentage = computed(() => Math.min((this.tokenCount() / this.currentMaxTokens()) * 100, 100));
  formattedTime = computed(() => {
    const totalSeconds = this.elapsedTime();
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  });

  selectTwoPhaseMode() {
    if (!this.isTwoPhaseMode()) {
      this.modeControl.setValue(this.isHtmlUploaded() ? 'phase2' : 'phase1');
    }
  }

  openSettings() {
    let savedMode: TranslationMode | null = null;
    if (typeof localStorage !== 'undefined') {
      savedMode = localStorage.getItem('sila_pdf_translator_default_mode') as TranslationMode;
    }
    this.defaultModeControl.setValue(savedMode || 'zero_svg');
    this.showSettingsModal.set(true);
  }

  closeSettings() {
    this.showSettingsModal.set(false);
  }

  saveSettings() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sila_pdf_translator_default_mode', this.defaultModeControl.value);
    }
    this.showSettingsModal.set(false);
    this.showToast('success', 'Đã lưu chế độ mặc định!');
  }

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.timerInterval) clearInterval(this.timerInterval);
      if (this.cropTimeout) clearTimeout(this.cropTimeout);
      this.toastTimeouts.forEach(t => clearTimeout(t));
    });

    this.modeControl.valueChanges.subscribe(val => {
      this.mode.set(val);
      // Ép Temperature về mặc định khi đổi chế độ
      if (val === 'phase2') {
        this.temperatureControl.setValue(0.5);
      } else {
        this.temperatureControl.setValue(0.3);
      }
    });
    this.temperatureControl.valueChanges.subscribe(val => this.temperature.set(val));
    this.useGoogleSearchControl.valueChanges.subscribe(val => this.useGoogleSearch.set(val));

    // Handle initial mode load
    if (typeof localStorage !== 'undefined') {
      const savedMode = localStorage.getItem('sila_pdf_translator_default_mode') as TranslationMode;
      if (savedMode) {
        this.modeControl.setValue(savedMode);
        this.mode.set(savedMode);
      }
    }

    effect(() => {
      if (this.resultHtml()) {
        setTimeout(() => this.updateIframe(), 50);
      }
    });
  }

  showToast(type: 'error' | 'info' | 'success', message: string) {
    const id = this.toastIdCounter++;
    this.toasts.update(t => [...t, { id, type, message }]);
    const timeoutId = setTimeout(() => {
      this.removeToast(id);
      this.toastTimeouts.delete(timeoutId);
    }, 5000);
    this.toastTimeouts.add(timeoutId);
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

  private async handleFile(file: File) {
    if (file.type !== 'application/pdf') {
      this.showToast('error', 'Vui lòng tải lên tệp PDF.');
      this.selectedFile.set(null);
      this.fileBase64.set(null);
      return;
    }
    
    if (file.size > this.MAX_FILE_SIZE) { // 10MB limit
      this.showToast('error', 'Lỗi: Tệp tải lên vượt quá giới hạn 10MB.');
      this.selectedFile.set(null);
      this.fileBase64.set(null);
      return;
    }

    this.error.set(null);
    this.selectedFile.set(file);
    this.mimeType.set(file.type);
    this.resultHtml.set(null);
    this.croppedFile.set(null);
    this.pdfTotalPages.set(0);
    this.isCountingTokens.set(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPageCount();
      this.pdfTotalPages.set(pages);
      this.pdfStartPage.set(1);
      this.pdfEndPage.set(pages);
      await this.processPdfCrop();
    } catch (e) {
      console.error('Error reading PDF:', e);
      this.showToast('error', 'Lỗi khi đọc file PDF.');
      this.isCountingTokens.set(false);
    }
  }

  onPageChange() {
    if (this.cropTimeout) clearTimeout(this.cropTimeout);
    this.cropTimeout = setTimeout(() => {
      this.processPdfCrop();
    }, 500);
  }

  async processPdfCrop() {
    this.isCountingTokens.set(true);
    try {
      const file = this.selectedFile();
      if (!file) return;

      const start = Math.max(1, this.pdfStartPage());
      const end = Math.min(this.pdfTotalPages(), this.pdfEndPage());

      if (start > end) {
        this.showToast('error', 'Trang bắt đầu không được lớn hơn trang kết thúc.');
        this.isCountingTokens.set(false);
        return;
      }

      const arrayBuffer = await file.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      const pageIndices = [];
      for (let i = start - 1; i < end; i++) {
        pageIndices.push(i);
      }

      const copiedPages = await newPdf.copyPages(originalPdf, pageIndices);
      copiedPages.forEach(page => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      const croppedBlob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const croppedFileObj = new File([croppedBlob], file.name, { type: 'application/pdf' });

      this.croppedFile.set(croppedFileObj);

      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        this.fileBase64.set(base64String);
        this.checkTokenLimit(base64String, file.type);
      };
      reader.readAsDataURL(croppedFileObj);

    } catch (error) {
      console.error('Error cropping PDF:', error);
      this.showToast('error', 'Lỗi khi cắt PDF.');
      this.isCountingTokens.set(false);
    }
  }

  private handleHtmlFile(file: File) {
    if (file.size > this.MAX_FILE_SIZE_HTML) { // 0.5MB limit
      this.showToast('error', 'Lỗi: Tệp tải lên vượt quá giới hạn 500KB.');
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
    this.isCountingTokens.set(true);
    try {
      const tokens = await this.geminiService.countTokens(base64String, mimeType);
      this.tokenCount.set(tokens);
      const maxTokens = this.currentMaxTokens();
      if (tokens > maxTokens) {
        this.showToast('error', `Lỗi: Nội dung vượt quá giới hạn ${maxTokens.toLocaleString()} tokens (${tokens.toLocaleString()} tokens). Vui lòng cắt bớt trang hoặc giảm dung lượng.`);
      }
    } catch (e) {
      console.error('Không thể đếm token', e);
      this.showToast('error', 'Lỗi khi kiểm tra dung lượng tài liệu. Vui lòng thử lại.');
    } finally {
      this.isCountingTokens.set(false);
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

      if (currentMode === 'zero_math') {
        this.progressMessage.set('Dịch file PDF sang tiếng Việt (Tài liệu khoa học xã hội)...');
        const [instruction, prompt] = await Promise.all([
          this.loadPrompt('system_instructions_zero_math.md'),
          this.loadPrompt('prompt_zero_math.md')
        ]);
        const result = await this.geminiService.translate(base64, mime, prompt, instruction, temp, this.useGoogleSearch());
        this.resultHtml.set(this.extractHtml(result));
      }
      else if (currentMode === 'zero_svg') {
        this.progressMessage.set('Dịch file PDF sang tiếng Việt (Tài liệu khoa học nói chung)...');
        const [instruction, prompt] = await Promise.all([
          this.loadPrompt('system_instructions_zero_svg.md'),
          this.loadPrompt('prompt_zero_svg.md')
        ]);
        const result = await this.geminiService.translate(base64, mime, prompt, instruction, temp, this.useGoogleSearch());
        this.resultHtml.set(this.extractHtml(result));
      }
      else if (currentMode === 'normal') {
        this.progressMessage.set('Dịch file PDF sang tiếng Việt (Tài liệu toán chuyên ngành)...');
        const [instruction, prompt] = await Promise.all([
          this.loadPrompt('system_instructions.md'),
          this.loadPrompt('prompt.md')
        ]);
        const result = await this.geminiService.translate(base64, mime, prompt, instruction, temp, this.useGoogleSearch());
        this.resultHtml.set(this.extractHtml(result));
      }
      else if (currentMode === 'phase1') {
        this.progressMessage.set('Chuyển định dạng PDF sang HTML (English / Giữ nguyên nội dung)...');
        const [instruction, prompt] = await Promise.all([
          this.loadPrompt('system_instructions_phase_1.md'),
          this.loadPrompt('prompt_phase_1.md')
        ]);
        const result = await this.geminiService.translate(base64, mime, prompt, instruction, temp, false);
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
        const result = await this.geminiService.translateHtml(htmlContent, prompt, instruction, temp, this.useGoogleSearch());
        this.resultHtml.set(this.extractHtml(result));
      }

      this.progressMessage.set('Done!');
      if (currentMode === 'phase1') {
        this.showToast('success', 'Quá trình chuyển đổi tài liệu hoàn tất!');
      } else {
        this.showToast('success', 'Quá trình dịch tài liệu hoàn tất!');
      }
      
    } catch (e: unknown) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      
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
    if (this.previewIframe?.nativeElement && this.resultHtml()) {
      this.previewIframe.nativeElement.srcdoc = this.resultHtml()!;
    }
  }

  resetApp() {
    if (this.resultHtml()) {
      this.showResetConfirm.set(true);
      setTimeout(() => {
        this.cancelResetBtn?.nativeElement?.focus();
      }, 50);
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
    this.mimeType.set('');
    this.resultHtml.set(null);
    this.error.set(null);
    this.tokenCount.set(0);
    this.progressMessage.set('');
    this.elapsedTime.set(0);
    this.isFullscreen.set(false);
    this.showResetConfirm.set(false);
    
    this.modeControl.setValue('zero_svg');

    this.showToast('info', 'Đã làm mới phiên làm việc.');
    setTimeout(() => {
      this.resetBtn?.nativeElement?.focus();
    }, 50);
  }

  cancelReset() {
    this.showResetConfirm.set(false);
    setTimeout(() => {
      this.resetBtn?.nativeElement?.focus();
    }, 50);
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

  async onSearch(query: string) {
    if (!query.trim() || this.isSearching()) return;

    this.searchQuery.set(query);
    this.isSearching.set(true);
    this.translatedQuery.set('');

    try {
      const result = await this.geminiService.translateSearchQuery(query);
      this.translatedQuery.set(result);
    } catch (e: unknown) {
      console.error('Lỗi khi dịch từ khóa tìm kiếm', e);
      this.showToast('error', 'Lỗi khi dịch từ khóa. Vui lòng thử lại.');
    } finally {
      this.isSearching.set(false);
    }
  }

  closeSearch() {
    this.translatedQuery.set('');
    this.searchQuery.set('');
  }
}
