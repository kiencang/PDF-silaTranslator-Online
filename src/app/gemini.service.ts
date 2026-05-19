import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface GeminiCandidate {
  content?: {
    parts?: { text?: string }[];
  };
  finishReason?: string;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private http = inject(HttpClient);
  private readonly MODEL_NAME_PRO = 'gemini-pro-latest';
  private readonly MODEL_NAME_FLASH = 'gemini-flash-latest';

  async countTokens(fileData: string, mimeType: string): Promise<number> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ totalTokens: number }>('/api/gemini/countTokens', { fileData, mimeType })
      );
      return response.totalTokens || 0;
    } catch (e: unknown) {
      console.error(e);
      return 0;
    }
  }

  private checkResponse(response: GeminiResponse): string {
    const candidate = response.candidates?.[0];
    if (candidate?.finishReason) {
      const reason = candidate.finishReason;
      if (reason === 'RECITATION') {
        throw new Error('Google Gemini từ chối xử lý file này do chính sách bản quyền (Recitation). Vui lòng sử dụng chế độ Dịch 1 giai đoạn.');
      } else if (reason === 'SAFETY') {
        throw new Error('Tài liệu bị từ chối do vi phạm chính sách an toàn của Google (Safety).');
      }
    }

    const text = candidate?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini không trả về kết quả (có thể do lỗi hệ thống hoặc bộ lọc). Vui lòng thử lại.');
    }

    return text;
  }

  async translate(
    fileData: string,
    mimeType: string,
    prompt: string,
    systemInstruction: string,
    temperature: number,
    useGoogleSearch = false
  ): Promise<string> {
    const config = {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      temperature: temperature,
    };
    
    const tools = useGoogleSearch ? [{ googleSearch: {} }] : undefined;

    try {
      const response = await firstValueFrom(
        this.http.post<GeminiResponse>('/api/gemini/generate', {
          model: this.MODEL_NAME_PRO,
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    data: fileData,
                    mimeType: mimeType
                  }
                },
                { text: prompt }
              ]
            }
          ],
          config: { ...config, tools }
        })
      );

      return this.checkResponse(response);
    } catch (e: any) {
      const errorMsg = e.error?.error || e.message || 'Lỗi không xác định khi dịch tài liệu';
      throw new Error(errorMsg);
    }
  }

  async translateHtml(
    htmlContent: string,
    prompt: string,
    systemInstruction: string,
    temperature: number,
    useGoogleSearch = false
  ): Promise<string> {
    const config = {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      temperature: temperature,
    };
    const tools = useGoogleSearch ? [{ googleSearch: {} }] : undefined;

    try {
      const response = await firstValueFrom(
        this.http.post<GeminiResponse>('/api/gemini/generate', {
          model: this.MODEL_NAME_PRO,
          contents: [
            {
              parts: [
                { text: htmlContent },
                { text: prompt }
              ]
            }
          ],
          config: { ...config, tools }
        })
      );

      return this.checkResponse(response);
    } catch (e: any) {
      const errorMsg = e.error?.error || e.message || 'Lỗi khi dịch HTML';
      throw new Error(errorMsg);
    }
  }

  async translateSearchQuery(query: string): Promise<string> {
    const systemInstruction = `Bạn là một AI chuyên dịch truy vấn tìm kiếm (search queries) từ tiếng Việt sang tiếng Anh. Nhiệm vụ DUY NHẤT của bạn là trả về MỘT (1) truy vấn tìm kiếm tiếng Anh hiệu quả nhất, dựa trên đánh giá của bạn về ý định (search intent) và cách tìm kiếm phổ biến nhất trong tiếng Anh.

QUY TẮC BẮT BUỘC TUÂN THỦ:
1.  **CHỈ MỘT KẾT QUẢ:** Luôn luôn và chỉ luôn trả về DUY NHẤT MỘT chuỗi văn bản là bản dịch truy vấn tốt nhất. KHÔNG được đưa ra nhiều lựa chọn.
2.  **CHỈ VĂN BẢN THUẦN TÚY:** Kết quả trả về CHỈ BAO GỒM văn bản tiếng Anh đã dịch. TUYỆT ĐỐI KHÔNG thêm bất kỳ lời chào, lời giải thích, ghi chú, dấu ngoặc kép bao quanh, định dạng markdown, hoặc bất kỳ ký tự/từ ngữ nào khác ngoài chính truy vấn đã dịch.
3.  **ƯU TIÊN HIỆU QUẢ TÌM KIẾM HỌC THUẬT:** Mục tiêu là tạo ra truy vấn mà các nhà nghiên cứu, sinh viên thực sự sẽ gõ vào máy tìm kiếm tài liệu khoa học (như Google Scholar). Ưu tiên thuật ngữ chuyên ngành (academic terminology), danh từ cốt lõi, và các từ khóa nghiên cứu phổ biến (ví dụ: impact of, efficacy, meta-analysis, case study, literature review, characteristics, v.v.). Tránh các từ giao tiếp thông thường.
4.  **ĐỘ CHÍNH XÁC VỀ Ý ĐỊNH:** Nắm bắt chính xác nhất ý định đằng sau truy vấn gốc tiếng Việt. Nếu mơ hồ, hãy chọn cách diễn giải phổ biến hoặc khả năng cao nhất.
5.  **ĐỊNH DẠNG ĐẦU RA:** Đảm bảo đầu ra là một chuỗi văn bản thuần túy (plain text string) duy nhất, sẵn sàng để sao chép và dán trực tiếp vào thanh tìm kiếm.`;

    const prompt = `Provide the single best English search query translation for the following Vietnamese query. Output ONLY the raw English text, nothing else: ${query}`;

    try {
      const response = await firstValueFrom(
        this.http.post<GeminiResponse>('/api/gemini/generate', {
          model: this.MODEL_NAME_FLASH,
          contents: [
            { parts: [{ text: prompt }] }
          ],
          config: {
            systemInstruction: { parts: [{ text: systemInstruction }] },
            temperature: 0.1
          }
        })
      );

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      return (text || '').trim();
    } catch (e: any) {
      const errorMsg = e.error?.error || e.message || 'Lỗi khi dịch từ khóa';
      throw new Error(errorMsg);
    }
  }
}
