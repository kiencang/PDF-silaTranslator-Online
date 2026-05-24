import { Component, ChangeDetectionStrategy, signal, inject, ViewChild, ElementRef, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { ToastService } from './toast.service';
import { LucideAngularModule, UploadCloud, FileText, Settings, Play, Download, CheckCircle2, AlertCircle, Loader2, ArrowDown, Maximize, Minimize, Clock, RefreshCw, Info, X, Search, ExternalLink, Scissors, FileEdit, User, Zap, Key, Eye, EyeOff, Trash2 } from 'lucide-angular';
import { SettingsModalComponent } from './settings-modal.component';
import { ApiKeyModalComponent } from './api-key-modal.component';
import { ToastsComponent } from './toasts.component';
import { ResetConfirmModalComponent } from './reset-confirm-modal.component';
import { HeaderControlsComponent } from './header-controls.component';
import { UploadZoneComponent } from './upload-zone.component';
import { ConfigSectionComponent } from './config-section.component';
import { ResultSectionComponent } from './result-section.component';
import { TranslatedDoc } from './storage.service';
import { HistoryModalComponent } from './history-modal.component';
import { TranslationState, TranslationMode } from './translation.state';
export type { TranslationMode } from './translation.state';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, LucideAngularModule, SettingsModalComponent, ApiKeyModalComponent, ToastsComponent, ResetConfirmModalComponent, HeaderControlsComponent, UploadZoneComponent, ConfigSectionComponent, ResultSectionComponent, HistoryModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private destroyRef = inject(DestroyRef);
  private toastService = inject(ToastService);
  private translationState = inject(TranslationState);

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
  readonly User = User;
  readonly Zap = Zap;
  readonly Key = Key;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly Trash2 = Trash2;

  // Form Controls
  modeControl = new FormControl<TranslationMode>('zero_svg', { nonNullable: true });
  defaultModeControl = new FormControl<TranslationMode>('zero_svg', { nonNullable: true });
  useGoogleSearchControl = new FormControl<boolean>(false, { nonNullable: true });
  
  // UI States
  showSettingsModal = signal<boolean>(false);
  showApiKeyModal = signal<boolean>(false);
  tempApiKey = signal<string>('');
  showKeyPlain = signal<boolean>(false);
  showResetConfirm = signal<boolean>(false);
  showHistoryModal = signal<boolean>(false);
  isFullscreen = signal<boolean>(false);
  
  @ViewChild('resetBtn') resetBtn?: ElementRef<HTMLButtonElement>;

  // Expose store state to view
  selectedModel = this.translationState.selectedModel;
  selectedFile = this.translationState.selectedFile;
  hasFile = this.translationState.hasFile;
  isLoadedFromHistory = this.translationState.isLoadedFromHistory;
  resultHtml = this.translationState.resultHtml;
  pdfTotalPages = this.translationState.pdfTotalPages;
  pdfStartPage = this.translationState.pdfStartPage;
  pdfEndPage = this.translationState.pdfEndPage;
  tokenCount = this.translationState.tokenCount;
  isCountingTokens = this.translationState.isCountingTokens;
  currentMaxTokens = this.translationState.currentMaxTokens;
  tokenPercentage = this.translationState.tokenPercentage;
  error = this.translationState.error;
  isProcessing = this.translationState.isProcessing;
  progressMessage = this.translationState.progressMessage;
  formattedTime = this.translationState.formattedTime;
  isHtmlUploaded = this.translationState.isHtmlUploaded;
  isPdfUploaded = this.translationState.isPdfUploaded;
  isTwoPhaseMode = this.translationState.isTwoPhaseMode;
  userApiKey = this.translationState.userApiKey;
  historyItems = this.translationState.historyItems;
  mode = this.translationState.mode;
  useGoogleSearch = this.translationState.useGoogleSearch;
  canProcess = this.translationState.canProcess;

  private cropTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.toastService.clearAll();
      this.translationState.cancelTimer();
      if (this.cropTimeout) clearTimeout(this.cropTimeout);
    });

    this.modeControl.valueChanges.subscribe(val => {
      this.translationState.mode.set(val);
    });
    this.useGoogleSearchControl.valueChanges.subscribe(val => this.translationState.useGoogleSearch.set(val));

    // Handle initial mode load
    if (typeof localStorage !== 'undefined') {
      const savedMode = localStorage.getItem('sila_pdf_translator_default_mode') as TranslationMode;
      if (savedMode) {
        this.modeControl.setValue(savedMode);
        this.translationState.mode.set(savedMode);
      }

      // Load saved user API Key
      const savedKey = localStorage.getItem('sila_pdf_translator_user_api_key');
      if (savedKey) {
        this.translationState.userApiKey.set(savedKey);
      }
    }
  }

  showToast(type: 'error' | 'info' | 'success', message: string) {
    this.toastService.show(type, message);
  }

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

  openApiKeyModal() {
    if (this.isProcessing()) return;
    if (typeof localStorage !== 'undefined') {
      const savedKey = localStorage.getItem('sila_pdf_translator_user_api_key') || '';
      this.tempApiKey.set(savedKey);
    } else {
      this.tempApiKey.set('');
    }
    this.showKeyPlain.set(false);
    this.showApiKeyModal.set(true);
  }

  closeApiKeyModal() {
    this.showApiKeyModal.set(false);
  }

  saveApiKey() {
    const keyVal = this.tempApiKey().trim();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sila_pdf_translator_user_api_key', keyVal);
    }
    this.translationState.userApiKey.set(keyVal);
    this.showApiKeyModal.set(false);
    if (keyVal) {
      this.showToast('success', 'Đã lưu cấu hình API Key cá nhân của bạn!');
    } else {
      this.showToast('info', 'Đã xóa cấu hình API Key cá nhân. Hệ thống quay lại sử dụng Key mặc định.');
    }
  }

  clearApiKey() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('sila_pdf_translator_user_api_key');
    }
    this.translationState.userApiKey.set('');
    this.tempApiKey.set('');
    this.showApiKeyModal.set(false);
    this.showToast('info', 'Đã xóa cấu hình API Key cá nhân. Hệ thống quay lại sử dụng Key mặc định.');
  }

  toggleShowKeyPlain() {
    this.showKeyPlain.update(v => !v);
  }

  onFileSelected(file: File) {
    this.translationState.isLoadedFromHistory.set(false);
    if (file.type === 'application/pdf') {
       this.translationState.handlePdfFile(file);
    } else if (file.type === 'text/html' || file.name.endsWith('.html')) {
       this.translationState.handleHtmlFile(file);
       this.modeControl.setValue('phase2');
       this.showToast('info', 'Đã tự động chuyển sang Phase 2 do phát hiện file HTML.');
    } else {
       this.showToast('error', 'Vui lòng tải lên tệp PDF hoặc HTML.');
    }
  }

  onPageChange() {
    if (this.cropTimeout) clearTimeout(this.cropTimeout);
    this.cropTimeout = setTimeout(() => {
      this.translationState.processPdfCrop();
    }, 500);
  }

  processFile() {
    this.translationState.processFile();
  }

  resetApp() {
    if (this.resultHtml()) {
      this.showResetConfirm.set(true);
    } else {
      this.confirmReset();
    }
  }

  confirmReset() {
    this.translationState.resetSession();
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
    const htmlText = this.resultHtml();
    if (htmlText) {
      const blob = new Blob([htmlText], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const file = this.selectedFile();
      const suffix = this.mode() === 'phase1' ? '_converted' : '_translated';
      a.download = `${file?.name.replace(/\.[^/.]+$/, "") || 'document'}${suffix}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.showToast('success', 'Đã tải file HTML xuống máy.');
    }
  }

  async openHistory() {
    await this.translationState.fetchHistory();
    this.showHistoryModal.set(true);
  }

  closeHistory() {
    this.showHistoryModal.set(false);
  }

  deleteHistoryItem(id: number) {
    this.translationState.deleteHistoryItem(id);
  }

  selectHistoryItem(doc: TranslatedDoc) {
    this.translationState.restoreFromHistory(doc);
    this.modeControl.setValue(doc.mode as TranslationMode);
    this.showHistoryModal.set(false);
    this.showToast('success', 'Đã khôi phục thành công bản dịch từ lịch sử dịch!');
  }
}
