import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Loader2, X, ExternalLink } from 'lucide-angular';
import { GeminiService } from './gemini.service';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-full md:w-96 lg:w-[500px]">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        @if (isSearching()) {
          <lucide-icon [img]="Loader2" class="w-4 h-4 text-indigo-500 animate-spin" aria-hidden="true"></lucide-icon>
        } @else {
          <lucide-icon [img]="Search" class="w-4 h-4 text-slate-400" aria-hidden="true"></lucide-icon>
        }
      </div>
      <input 
        type="text" 
        #searchInput
        [disabled]="isSearching()"
        (keydown.enter)="onSearch(searchInput.value)"
        aria-label="Tìm kiếm tài liệu trên Google Scholar"
        role="combobox"
        [attr.aria-expanded]="translatedQuery() ? 'true' : 'false'"
        aria-controls="search-results"
        class="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-full leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed" 
        placeholder="Nhập từ khóa tiếng Việt để tìm tài liệu trên Scholar..."
      >
      
      <span class="sr-only" aria-live="polite">
        {{ isSearching() ? 'Đang dịch từ khóa...' : (translatedQuery() ? 'Đã dịch xong, nhấn Tab để mở kết quả trên Google Scholar' : '') }}
      </span>

      <!-- Search Results Dropdown -->
      @if (translatedQuery()) {
        <div id="search-results" class="absolute top-full right-0 mt-2 w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in duration-200">
          <div class="p-4">
            <div class="flex justify-between items-start mb-2">
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Từ khóa tiếng Anh:</span>
              <button (click)="closeSearch()" aria-label="Đóng kết quả tìm kiếm" class="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 rounded-md p-0.5 cursor-pointer">
                <lucide-icon [img]="XIcon" class="w-4 h-4" aria-hidden="true"></lucide-icon>
              </button>
            </div>
            <p class="text-slate-900 font-medium mb-4 break-words">{{ translatedQuery() }}</p>
            <a 
              [href]="'https://scholar.google.com/scholar?q=' + translatedQuery()" 
              target="_blank" 
              rel="noopener noreferrer"
              class="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer"
            >
              <span>Mở Google Scholar</span>
              <lucide-icon [img]="ExternalLink" class="w-4 h-4" aria-hidden="true"></lucide-icon>
            </a>
          </div>
        </div>
      }
    </div>
  `
})
export class SearchBarComponent {
  readonly Search = Search;
  readonly Loader2 = Loader2;
  readonly XIcon = X;
  readonly ExternalLink = ExternalLink;

  private geminiService = inject(GeminiService);
  private toastService = inject(ToastService);

  isSearching = signal<boolean>(false);
  translatedQuery = signal<string>('');
  searchQuery = signal<string>('');

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
      const errorMessage = e instanceof Error ? e.message : String(e);
      
      let hasUserKey = false;
      if (typeof localStorage !== 'undefined') {
        const userKey = localStorage.getItem('sila_pdf_translator_user_api_key');
        if (userKey && userKey.trim() !== '') {
          hasUserKey = true;
        }
      }

      if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota')) {
        if (!hasUserKey) {
          this.toastService.show('error', 'Lỗi: Hệ thống AI đã hết lượt sử dụng (Quota exceeded) miễn phí cho Key hệ thống. Bạn có thể nhập Key của riêng bạn để dùng tiếp. Phần nhập Key nằm ở đầu trang.');
        } else {
          this.toastService.show('error', 'Lỗi: Hệ thống AI đã hết lượt sử dụng (Quota exceeded) miễn phí, bạn có thể sử dụng Key trả phí, hoặc Key miễn phí khác còn hạn ngạch.');
        }
      } 
      else if (errorMessage.includes('503') || errorMessage.toLowerCase().includes('overloaded')) {
        this.toastService.show('error', 'Lỗi: Máy chủ AI hiện đang bận (Overloaded). Vui lòng thử lại sau.');
      }
      else if (errorMessage.toLowerCase().includes('safety') || errorMessage.toLowerCase().includes('blocked')) {
        this.toastService.show('error', 'Lỗi: Tài liệu bị từ chối do vi phạm chính sách an toàn của Google.');
      }
      else if (errorMessage.includes('JSON.parse: unexpected character')) {
        this.toastService.show('error', 'Lỗi: Máy chủ nhận quá nhiều yêu cầu hoặc phản hồi lỗi. Vui lòng thử lại sau vài giây.');
      }
      else {
        let simplifiedMsg = errorMessage;
        try {
          if (errorMessage.includes('{') && errorMessage.includes('}')) {
            const startIdx = errorMessage.indexOf('{');
            const endIdx = errorMessage.lastIndexOf('}') + 1;
            const jsonPart = errorMessage.substring(startIdx, endIdx);
            const parsed = JSON.parse(jsonPart);
            if (parsed.error?.message) {
              simplifiedMsg = parsed.error.message;
            } else if (parsed.message) {
              simplifiedMsg = parsed.message;
            }
          }
        } catch {
          // Keep original errorMessage
        }
        this.toastService.show('error', `Lỗi dịch từ khóa: ${simplifiedMsg}`);
      }
    } finally {
      this.isSearching.set(false);
    }
  }

  closeSearch() {
    this.translatedQuery.set('');
    this.searchQuery.set('');
  }
}
