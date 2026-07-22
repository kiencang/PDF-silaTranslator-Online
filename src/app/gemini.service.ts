import { Injectable } from '@angular/core';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private readonly MODEL_NAME_PRO = 'gemini-pro-latest';
  private readonly MODEL_NAME_FLASH = 'gemini-flash-latest';

  private getAiInstance(): GoogleGenAI {
    if (typeof localStorage !== 'undefined') {
      const userKey = localStorage.getItem('sila_pdf_translator_user_api_key');
      if (userKey && userKey.trim() !== '') {
        return new GoogleGenAI({ 
           apiKey: userKey.trim(),
           // When calling from browser, the SDK handles CORS properly with rest endpoints.
        });
      }
    }
    throw new Error('Vui lòng thiết lập "API Key cá nhân" trong phần "Nhập API Key" (nằm ngay dưới logo) để sử dụng ứng dụng.');
  }

  async countTokens(fileData: string, mimeType: string): Promise<number> {
    try {
      const ai = this.getAiInstance();
      const contentParts = mimeType === 'text/html' ? [{ text: fileData }] : [{
        inlineData: {
          data: fileData,
          mimeType: mimeType
        }
      }];
      
      const result = await ai.models.countTokens({
        model: 'gemini-flash-lite-latest',
        contents: [
          { parts: contentParts as unknown as Record<string, unknown>[] }
        ]
      });
      return result.totalTokens || 0;
    } catch (e: unknown) {
      if (e instanceof Error) {
        throw new Error(e.message);
      }
      throw new Error('Lỗi khi tính số token.');
    }
  }

  private extractTextFromResponse(response: { candidates?: { finishReason?: string }[]; text?: string }): string {
    const candidate = response.candidates?.[0];
    if (candidate?.finishReason) {
      const reason = candidate.finishReason;
      if (reason === 'RECITATION') {
        throw new Error('Google Gemini từ chối xử lý file này do chính sách bản quyền (Recitation). Vui lòng sử dụng chế độ Dịch 1 giai đoạn.');
      } else if (reason === 'SAFETY') {
        throw new Error('Tài liệu bị từ chối do vi phạm chính sách an toàn của Google (Safety).');
      }
    }

    const text = response.text;
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
    useGoogleSearch = false,
    modelName: string = this.MODEL_NAME_PRO,
    images: {id: string, dataUrl: string}[] = []
  ): Promise<string> {
    const ai = this.getAiInstance();
    const config: Record<string, unknown> = {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      thinkingConfig: { thinkingLevel: 'HIGH' },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
      ]
    };
    
    if (useGoogleSearch) {
      config['tools'] = [{ googleSearch: {} }];
    }

    const parts: any[] = [];
    
    // Add the main document
    const cleanFileData = fileData.includes(',') ? fileData.split(',')[1] : fileData;
    parts.push({
      inlineData: {
        data: cleanFileData,
        mimeType: mimeType
      }
    });

    // Add extracted images
    for (const img of images) {
      if (img.dataUrl.includes(',')) {
        const mime = img.dataUrl.split(';')[0].split(':')[1];
        const data = img.dataUrl.split(',')[1];
        parts.push({
          inlineData: {
            data: data,
            mimeType: mime
          }
        });
        parts.push({ text: `(This image has ID: ${img.id})` });
      }
    }

    // Add the user prompt
    parts.push({ text: prompt });

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ parts: parts }],
        config
      });

      return this.extractTextFromResponse(response);
    } catch (e: unknown) {
      if (e instanceof Error) {
        throw new Error(e.message);
      }
      throw new Error('Lỗi không xác định khi dịch tài liệu');
    }
  }

  async translateHtml(
    htmlContent: string,
    prompt: string,
    systemInstruction: string,
    useGoogleSearch = false,
    modelName: string = this.MODEL_NAME_PRO,
    images: {id: string, dataUrl: string}[] = []
  ): Promise<string> {
    const ai = this.getAiInstance();
    const config: Record<string, unknown> = {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      thinkingConfig: { thinkingLevel: 'HIGH' },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
      ]
    };
    if (useGoogleSearch) {
      config['tools'] = [{ googleSearch: {} }];
    }

    const parts: any[] = [];
    
    const cleanHtmlContent = htmlContent.includes(',') ? htmlContent.split(',')[1] : htmlContent;
    parts.push({
      inlineData: {
        data: cleanHtmlContent,
        mimeType: 'text/html'
      }
    });

    if (images && images.length > 0) {
      const ids = images.map(img => img.id).join(', ');
      parts.push({ text: `Tài liệu HTML này chứa các hình ảnh có ID sau: [${ids}]. Nhiệm vụ của bạn là giữ nguyên các thẻ <img> và thuộc tính src tương ứng của chúng trong mã HTML kết quả.` });
    }

    parts.push({ text: prompt });

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ parts: parts }],
        config
      });

      return this.extractTextFromResponse(response);
    } catch (e: unknown) {
      if (e instanceof Error) {
        throw new Error(e.message);
      }
      throw new Error('Lỗi khi dịch HTML');
    }
  }

  async translateSearchQuery(query: string): Promise<string> {
    const ai = this.getAiInstance();
    const systemInstruction = `Bạn là một AI chuyên dịch truy vấn tìm kiếm (search queries) từ tiếng Việt sang Tiếng Anh. Nhiệm vụ DUY NHẤT của bạn là trả về MỘT (1) truy vấn tìm kiếm tiếng Anh hiệu quả nhất, dựa trên đánh giá của bạn về ý định (search intent) và cách tìm kiếm phổ biến nhất trong tiếng Anh.

QUY TẮC BẮT BUỘC TUÂN THỦ:
1.  **CHỈ MỘT KẾT QUẢ:** Luôn luôn và chỉ luôn trả về DUY NHẤT MỘT chuỗi văn bản là bản dịch truy vấn tốt nhất. KHÔNG được đưa ra nhiều lựa chọn.
2.  **CHỈ VĂN BẢN THUẦN TÚY:** Kết quả trả về CHỈ BAO GỒM văn bản tiếng Anh đã dịch. TUYỆT ĐỐI KHÔNG thêm bất kỳ lời chào, lời giải thích, ghi chú, dấu ngoặc kép bao quanh, định dạng markdown, hoặc bất kỳ ký tự/từ ngữ nào khác ngoài chính truy vấn đã dịch.
3.  **ƯU TIÊN HIỆU QUẢ TÌM KIẾM HỌC THUẬT:** Mục tiêu là tạo ra truy vấn mà các nhà nghiên cứu, sinh viên thực sự sẽ gõ vào máy tìm kiếm tài liệu khoa học (như Google Scholar). Ưu tiên thuật ngữ chuyên ngành (academic terminology), danh từ cốt lõi, và các từ khóa nghiên cứu phổ biến (ví dụ: impact of, efficacy, meta-analysis, case study, literature review, characteristics, v.v.). Tránh các từ giao tiếp thông thường.
4.  **ĐỘ CHÍNH XÁC VỀ Ý ĐỊNH:** Nắm bắt chính xác nhất ý định đằng sau truy vấn gốc tiếng Việt. Nếu mơ hồ, hãy chọn cách diễn giải phổ biến hoặc khả năng cao nhất.
5.  **ĐỊNH DẠNG ĐẦU RA:** Đảm bảo đầu ra là một chuỗi văn bản thuần túy (plain text string) duy nhất, sẵn sàng để sao chép và dán trực tiếp vào thanh tìm kiếm.`;

    const prompt = `Provide the single best English search query translation for the following Vietnamese query. Output ONLY the raw English text, nothing else: ${query}`;

    try {
      const response = await ai.models.generateContent({
        model: this.MODEL_NAME_FLASH,
        contents: [
          { parts: [{ text: prompt }] }
        ],
        config: {
          systemInstruction: { parts: [{ text: systemInstruction }] },
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
          ]
        }
      });

      return (response.text || '').trim();
    } catch (e: unknown) {
      if (e instanceof Error) {
        throw new Error(e.message);
      }
      throw new Error('Lỗi khi dịch từ khóa');
    }
  }

  public parseGeminiError(e: unknown): string {
    const errorMessage = e instanceof Error ? e.message : String(e);
    if (!errorMessage) {
      return 'Lỗi không xác định';
    }

    try {
      if (errorMessage.includes('{') && errorMessage.includes('}')) {
        const startIdx = errorMessage.indexOf('{');
        const endIdx = errorMessage.lastIndexOf('}') + 1;
        const jsonPart = errorMessage.substring(startIdx, endIdx);
        const parsed = JSON.parse(jsonPart);
        if (parsed.error?.message) {
          return parsed.error.message;
        } else if (parsed.message) {
          return parsed.message;
        }
      }
    } catch {
      // Ignored
    }

    return errorMessage;
  }
}

