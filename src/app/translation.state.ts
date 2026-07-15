import { Injectable, signal, computed, inject } from '@angular/core';
import { GeminiService } from './gemini.service';
import { ToastService } from './toast.service';
import { PdfService } from './pdf.service';
import { DbService } from './db.service';
import { StorageService, TranslatedDoc } from './storage.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type TranslationMode = 'zero_math' | 'zero_svg' | 'normal' | 'phase1' | 'phase2';

@Injectable({
  providedIn: 'root'
})
export class TranslationState {
  private geminiService = inject(GeminiService);
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private pdfService = inject(PdfService);
  private dbService = inject(DbService);
  private storageService = inject(StorageService);

  readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  readonly MAX_FILE_SIZE_HTML = 0.5 * 1024 * 1024; // 500KB
  readonly MAX_PDF_TOKENS = 25000;
  readonly MAX_HTML_TOKENS = 35000;
  private promptCache = new Map<string, string>();

  selectedModel = signal<'gemini-pro-latest' | 'gemini-flash-latest'>('gemini-flash-latest');
  selectedFile = signal<File | null>(null);
  fileBase64 = signal<string | null>(null);
  mimeType = signal<string>('');
  
  userApiKey = signal<string>('');
  mode = signal<TranslationMode>('zero_svg');
  useGoogleSearch = signal<boolean>(false);
  
  isProcessing = signal<boolean>(false);
  progressMessage = signal<string>('');
  error = signal<string | null>(null);
  
  resultHtml = signal<string | null>(null);
  tokenCount = signal<number>(0);
  isCountingTokens = signal<boolean>(false);
  
  pdfTotalPages = signal<number>(0);
  pdfStartPage = signal<number>(1);
  pdfEndPage = signal<number>(1);
  croppedFile = signal<File | null>(null);
  pdfHash = signal<string | null>(null);
  htmlExtractedImages = signal<{id: string, dataUrl: string}[]>([]);
  
  elapsedTime = signal<number>(0);
  isLoadedFromHistory = signal<boolean>(false);
  historyItems = signal<TranslatedDoc[]>([]);

  isPdfUploaded = computed(() => this.mimeType() === 'application/pdf');
  isHtmlUploaded = computed(() => this.mimeType() === 'text/html');
  currentMaxTokens = computed(() => this.mimeType() === 'text/html' ? this.MAX_HTML_TOKENS : this.MAX_PDF_TOKENS);
  hasFile = computed(() => this.selectedFile() !== null);
  canProcess = computed(() => this.hasFile() && !this.isProcessing() && !this.isCountingTokens() && this.tokenCount() <= this.currentMaxTokens());
  tokenPercentage = computed(() => Math.min((this.tokenCount() / this.currentMaxTokens()) * 100, 100));
  isTwoPhaseMode = computed(() => this.mode() === 'phase1' || this.mode() === 'phase2');
  
  formattedTime = computed(() => {
    const totalSeconds = this.elapsedTime();
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  });

  private timerInterval: ReturnType<typeof setInterval> | undefined;

  showToast(type: 'error' | 'info' | 'success', message: string) {
    this.toastService.show(type, message);
  }

  async handlePdfFile(file: File) {
    if (file.type !== 'application/pdf') {
      this.showToast('error', 'Vui lòng tải lên tệp PDF.');
      this.resetFileState();
      return;
    }
    
    if (file.size > this.MAX_FILE_SIZE) {
      this.showToast('error', 'Lỗi: Tệp tải lên vượt quá giới hạn 10MB.');
      this.resetFileState();
      return;
    }

    this.resetPartialState(file);
    this.isCountingTokens.set(true);

    try {
      const pages = await this.pdfService.getPageCount(file);
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

  async processPdfCrop() {
    this.isCountingTokens.set(true);
    this.pdfHash.set(null);
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

      const result = await this.pdfService.cropPdf(file, start, end, this.pdfTotalPages());
      this.croppedFile.set(result.croppedFile);
      this.fileBase64.set(result.fileBase64);
      await this.checkTokenLimit(result.fileBase64, file.type);

      // Extract images from the cropped PDF
      try {
        const hash = await this.pdfService.hashFile(result.croppedFile);
        this.pdfHash.set(hash);
        const extractedImages = await this.pdfService.extractImagesFromPDF(result.croppedFile, hash);
        
        // Save images to IndexedDB
        await this.dbService.clearImagesByPdf(hash);
        for (const img of extractedImages) {
           await this.dbService.saveImage(img.id, hash, img.dataUrl);
        }
      } catch (err) {
        console.warn('Lỗi khi trích xuất hình ảnh từ PDF:', err);
      }
    } catch (error) {
      console.error('Error cropping PDF:', error);
      this.showToast('error', 'Lỗi khi cắt PDF.');
      this.isCountingTokens.set(false);
    }
  }

  handleHtmlFile(file: File) {
    this.resetPartialState(file);

    const reader = new FileReader();
    reader.onload = async () => {
      const textContent = reader.result as string;
      const { cleanHtml, extractedImages } = this.extractImagesFromHtml(textContent);
      
      const encoder = new TextEncoder();
      const byteLength = encoder.encode(cleanHtml).length;
      
      if (byteLength > this.MAX_FILE_SIZE_HTML) {
        this.showToast('error', 'Lỗi: Tệp HTML (sau khi tách ảnh) vượt quá giới hạn 500KB.');
        this.resetFileState();
        return;
      }
      
      this.htmlExtractedImages.set(extractedImages);
      // store the clean base64 html
      const cleanBase64 = btoa(unescape(encodeURIComponent(cleanHtml)));
      this.fileBase64.set(cleanBase64);
      await this.checkTokenLimit(cleanBase64, file.type);
    };
    reader.readAsText(file);
  }

  private extractImagesFromHtml(html: string): { cleanHtml: string, extractedImages: { id: string, dataUrl: string }[] } {
    const extractedImages: { id: string, dataUrl: string }[] = [];
    let imgCount = 0;
    
    const regex = /(?:src|href|data)=(['"])(data:image\/.*?)\1|url\((['"]?)(data:image\/.*?)\3\)/gi;
    
    const cleanHtml = html.replace(regex, (match, q1, g1, q2, g2) => {
      const dataUrl = g1 || g2;
      const id = `img_placeholder_${crypto.randomUUID()}`;
      extractedImages.push({ id, dataUrl });
      return match.replace(dataUrl, id);
    });

    return { cleanHtml, extractedImages };
  }

  private resetFileState() {
    this.selectedFile.set(null);
    this.fileBase64.set(null);
  }

  private resetPartialState(file: File) {
    this.error.set(null);
    this.selectedFile.set(file);
    this.mimeType.set(file.type);
    this.resultHtml.set(null);
    this.croppedFile.set(null);
    this.pdfTotalPages.set(0);
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
    } catch (e: unknown) {
      const parsedError = this.geminiService.parseGeminiError(e);
      this.showToast('error', `Lỗi khi kiểm tra dung lượng tài liệu: ${parsedError}`);
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
      const currentMode = this.mode();
      
      let extractedImages: { id: string, dataUrl: string }[] = [];
      if (this.pdfHash()) {
        try {
          extractedImages = await this.dbService.getImagesByPdf(this.pdfHash()!);
        } catch (e) {
          console.warn('Không thể lấy ảnh từ DB', e);
        }
      }

      if (currentMode === 'zero_math') {
        this.progressMessage.set('Dịch file PDF sang tiếng Việt (Tài liệu khoa học xã hội)...');
        const [instruction, prompt] = await Promise.all([
          this.loadPrompt('system_instructions_zero_math.md'),
          this.loadPrompt('prompt_zero_math.md')
        ]);
        const result = await this.geminiService.translate(base64, mime, prompt, instruction, this.useGoogleSearch(), this.selectedModel(), extractedImages);
        let rawHtml = this.extractHtml(result);
        this.resultHtml.set(await this.postProcessHtml(rawHtml, extractedImages));
      }
      else if (currentMode === 'zero_svg') {
        this.progressMessage.set('Dịch file PDF sang tiếng Việt (Tài liệu khoa học nói chung)...');
        const [instruction, prompt] = await Promise.all([
          this.loadPrompt('system_instructions_zero_svg.md'),
          this.loadPrompt('prompt_zero_svg.md')
        ]);
        const result = await this.geminiService.translate(base64, mime, prompt, instruction, this.useGoogleSearch(), this.selectedModel(), extractedImages);
        let rawHtml = this.extractHtml(result);
        this.resultHtml.set(await this.postProcessHtml(rawHtml, extractedImages));
      }
      else if (currentMode === 'normal') {
        this.progressMessage.set('Dịch file PDF sang tiếng Việt (Tài liệu toán chuyên ngành)...');
        const [instruction, prompt] = await Promise.all([
          this.loadPrompt('system_instructions.md'),
          this.loadPrompt('prompt.md')
        ]);
        const result = await this.geminiService.translate(base64, mime, prompt, instruction, this.useGoogleSearch(), this.selectedModel(), extractedImages);
        let rawHtml = this.extractHtml(result);
        this.resultHtml.set(await this.postProcessHtml(rawHtml, extractedImages));
      }
      else if (currentMode === 'phase1') {
        this.progressMessage.set('Chuyển định dạng PDF sang HTML (English / Giữ nguyên nội dung)...');
        const [instruction, prompt] = await Promise.all([
          this.loadPrompt('system_instructions_phase_1.md'),
          this.loadPrompt('prompt_phase_1.md')
        ]);
        // Phase 1 might also benefit from images if we want to extract them to HTML. We'll pass them just in case.
        const result = await this.geminiService.translate(base64, mime, prompt, instruction, false, this.selectedModel(), extractedImages);
        let rawHtml = this.extractHtml(result);
        this.resultHtml.set(await this.postProcessHtml(rawHtml, extractedImages));
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
        
        const htmlContent = base64;
        const result = await this.geminiService.translateHtml(htmlContent, prompt, instruction, this.useGoogleSearch(), this.selectedModel(), this.htmlExtractedImages());
        let rawHtml = this.extractHtml(result);
        this.resultHtml.set(await this.postProcessHtml(rawHtml, this.htmlExtractedImages()));
      }

      this.progressMessage.set('Done!');
      if (currentMode === 'phase1') {
        this.showToast('success', 'Quá trình chuyển đổi tài liệu hoàn tất!');
      } else {
        this.showToast('success', 'Quá trình dịch tài liệu hoàn tất!');
      }

      await this.saveToHistory();
      
    } catch (e: unknown) {
      const parsedError = this.geminiService.parseGeminiError(e);
      
      if (parsedError.includes('429') || parsedError.toLowerCase().includes('quota')) {
        this.showToast('error', 'Lỗi: API Key của bạn đã vượt quá giới hạn (Quota exceeded). Vui lòng thử lại sau hoặc sử dụng Key khác.');
      } 
      else if (parsedError.includes('503') || parsedError.toLowerCase().includes('overloaded')) {
        this.showToast('error', 'Lỗi: Máy chủ AI hiện đang bận (Overloaded). Vui lòng thử lại sau.');
      }
      else if (parsedError.toLowerCase().includes('safety') || parsedError.toLowerCase().includes('blocked')) {
        this.showToast('error', 'Lỗi: Tài liệu bị từ chối do vi phạm chính sách an toàn của Google.');
      }
      else if (parsedError.includes('JSON.parse: unexpected character')) {
        this.showToast('error', 'Lỗi: Máy chủ nhận quá nhiều yêu cầu hoặc phản hồi lỗi. Vui lòng thử lại sau vài giây.');
      }
      else {
        this.showToast('error', `Lỗi: ${parsedError}`);
      }
    } finally {
      this.isProcessing.set(false);
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
    }
  }

  private async saveToHistory() {
    const file = this.selectedFile();
    const content = this.resultHtml();
    const currentMode = this.mode();
    if (file && content) {
      let vietnameseTitle = file.name;
      const h1Match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      if (h1Match) {
        vietnameseTitle = h1Match[1].replace(/<[^>]*>/g, '').trim();
      } else {
        const h2Match = content.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
        if (h2Match) {
          vietnameseTitle = h2Match[1].replace(/<[^>]*>/g, '').trim();
        }
      }
      
      if (!vietnameseTitle || vietnameseTitle.length === 0) {
        vietnameseTitle = file.name;
      } else if (vietnameseTitle.length > 100) {
        vietnameseTitle = vietnameseTitle.substring(0, 97) + '...';
      }

      await this.storageService.saveTranslation({
        originalFileName: file.name,
        vietnameseTitle: vietnameseTitle,
        mode: currentMode,
        timestamp: Date.now(),
        content: content,
        pdfHash: this.pdfHash() || undefined
      }).catch(err => console.error('Lỗi khi lưu lịch sử:', err));
    }
  }

  private extractHtml(text: string): string {
    const match = text.match(/```[a-zA-Z]*\s*([\s\S]*?)\s*```/);
    return match ? match[1] : text;
  }

  private async postProcessHtml(html: string, extractedImages: { id: string, dataUrl: string }[]): Promise<string> {
    if (!extractedImages || extractedImages.length === 0) return html;
    
    let processedHtml = html;
    for (const img of extractedImages) {
      // The AI might output <img src="[ID]" ...> or <img src="ID" ...>
      // We escape the ID just in case it contains special regex chars
      const escapedId = img.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Match exactly src="ID" or src='ID'
      const srcRegex = new RegExp(`src=["']\\[?${escapedId}\\]?["']`, 'g');
      processedHtml = processedHtml.replace(srcRegex, `src="${img.dataUrl}"`);
      
      // Fallback: If AI just outputs the ID anywhere else like [IMAGE: ID]
      const fallbackRegex = new RegExp(`\\[IMAGE:\\s*${escapedId}\\]`, 'g');
      processedHtml = processedHtml.replace(fallbackRegex, `<img src="${img.dataUrl}" style="max-width: 100%; height: auto;">`);
    }
    return processedHtml;
  }

  cancelTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  resetSession() {
    this.cancelTimer();
    this.selectedFile.set(null);
    this.isLoadedFromHistory.set(false);
    this.fileBase64.set(null);
    this.mimeType.set('');
    this.resultHtml.set(null);
    this.error.set(null);
    this.tokenCount.set(0);
    this.progressMessage.set('');
    this.elapsedTime.set(0);
  }

  async fetchHistory() {
    try {
      const items = await this.storageService.getAll();
      this.historyItems.set(items);
    } catch (err) {
      console.error('Không thể tải lịch sử:', err);
      this.showToast('error', 'Không thể đọc dữ liệu lịch sử dịch.');
    }
  }

  async deleteHistoryItem(id: number) {
    try {
      await this.storageService.delete(id);
      await this.fetchHistory();
      this.showToast('success', 'Đã xóa bản dịch khỏi lịch sử thành công.');
    } catch (err) {
      console.error('Không thể xóa item:', err);
      this.showToast('error', 'Không thể xóa bản dịch khỏi lịch sử.');
    }
  }

  restoreFromHistory(doc: TranslatedDoc) {
    const isHtml = doc.mode === 'phase2';
    const dummyFile = new File([], doc.originalFileName, { type: isHtml ? 'text/html' : 'application/pdf' });
    
    this.selectedFile.set(dummyFile);
    this.isLoadedFromHistory.set(true);
    this.mimeType.set(dummyFile.type);
    this.resultHtml.set(doc.content);
    this.mode.set(doc.mode as TranslationMode);
    
    this.tokenCount.set(0);
    this.error.set(null);
    this.progressMessage.set('Đã khôi phục từ lịch sử');
  }
}
