import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';
import { GoogleGenAI, ThinkingLevel, GenerateContentConfig } from '@google/genai';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Increase JSON body limit since we are uploading potentially large files/text
app.use(express.json({ limit: '50mb' }));

const MODEL_NAME_PRO = 'gemini-3.1-pro-preview';
const MODEL_NAME_FLASH = 'gemini-flash-latest';

function getGenAI() {
  const apiKey = process.env['GEMINI_API_KEY'];
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  return new GoogleGenAI({ apiKey });
}

app.post('/api/count-tokens', async (req, res) => {
  try {
    const { fileData, mimeType } = req.body;
    const ai = getGenAI();
    const response = await ai.models.countTokens({
      model: MODEL_NAME_FLASH,
      contents: [
        mimeType === 'text/html' ? fileData : {
          inlineData: {
            data: fileData,
            mimeType: mimeType
          }
        }
      ]
    });
    res.json({ tokens: response.totalTokens || 0 });
  } catch (error) {
    console.error('Count tokens error:', error);
    res.status(500).json({ error: 'Failed to count tokens' });
  }
});

app.post('/api/translate', async (req, res) => {
  try {
    const { fileData, mimeType, prompt, systemInstruction, temperature, useGoogleSearch } = req.body;
    
    const config: GenerateContentConfig = {
      systemInstruction: systemInstruction,
      temperature: temperature,
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
    };
    if (useGoogleSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: MODEL_NAME_PRO,
      contents: [
        {
          inlineData: {
            data: fileData,
            mimeType: mimeType
          }
        },
        prompt
      ],
      config
    });

    const candidate = response.candidates?.[0];
    if (candidate?.finishReason) {
      const reason = candidate.finishReason;
      if (reason === 'RECITATION') {
        throw new Error('Google Gemini từ chối xử lý file này do chính sách bản quyền (Recitation). Vui lòng sử dụng chế độ Dịch 1 giai đoạn.');
      } else if (reason === 'SAFETY') {
        throw new Error('Tài liệu bị từ chối do vi phạm chính sách an toàn của Google (Safety).');
      }
    }

    res.json({ text: response.text });
  } catch (error: unknown) {
    console.error('Translation error:', error);
    res.status(500).json({ error: (error instanceof Error ? error.message : 'Lỗi server khi dịch tài liệu') });
  }
});

app.post('/api/translate-html', async (req, res) => {
  try {
    const { htmlContent, prompt, systemInstruction, temperature, useGoogleSearch } = req.body;

    const config: GenerateContentConfig = {
      systemInstruction: systemInstruction,
      temperature: temperature,
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
    };
    if (useGoogleSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: MODEL_NAME_PRO,
      contents: [
        htmlContent,
        prompt
      ],
      config
    });

    const candidate = response.candidates?.[0];
    if (candidate?.finishReason) {
      const reason = candidate.finishReason;
      if (reason === 'RECITATION') {
        throw new Error('Google Gemini từ chối xử lý file này do chính sách bản quyền (Recitation). Vui lòng sử dụng chế độ Dịch 1 giai đoạn.');
      } else if (reason === 'SAFETY') {
        throw new Error('Tài liệu bị từ chối do vi phạm chính sách an toàn của Google (Safety).');
      }
    }

    res.json({ text: response.text });
  } catch (error: unknown) {
    console.error('Translation HTML error:', error);
    res.status(500).json({ error: (error instanceof Error ? error.message : 'Lỗi server khi dịch tài liệu HTML') });
  }
});

app.post('/api/translate-search', async (req, res) => {
  try {
    const { query } = req.body;
    const systemInstruction = `Bạn là một AI chuyên dịch truy vấn tìm kiếm (search queries) từ tiếng Việt sang tiếng Anh. Nhiệm vụ DUY NHẤT của bạn là trả về MỘT (1) truy vấn tìm kiếm tiếng Anh hiệu quả nhất, dựa trên đánh giá của bạn về ý định (search intent) và cách tìm kiếm phổ biến nhất trong tiếng Anh.

QUY TẮC BẮT BUỘC TUÂN THỦ:
1.  **CHỈ MỘT KẾT QUẢ:** Luôn luôn và chỉ luôn trả về DUY NHẤT MỘT chuỗi văn bản là bản dịch truy vấn tốt nhất. KHÔNG được đưa ra nhiều lựa chọn.
2.  **CHỈ VĂN BẢN THUẦN TÚY:** Kết quả trả về CHỈ BAO GỒM văn bản tiếng Anh đã dịch. TUYỆT ĐỐI KHÔNG thêm bất kỳ lời chào, lời giải thích, ghi chú, dấu ngoặc kép bao quanh, định dạng markdown, hoặc bất kỳ ký tự/từ ngữ nào khác ngoài chính truy vấn đã dịch.
3.  **ƯU TIÊN HIỆU QUẢ TÌM KIẾM HỌC THUẬT:** Mục tiêu là tạo ra truy vấn mà các nhà nghiên cứu, sinh viên thực sự sẽ gõ vào máy tìm kiếm tài liệu khoa học (như Google Scholar). Ưu tiên thuật ngữ chuyên ngành (academic terminology), danh từ cốt lõi, và các từ khóa nghiên cứu phổ biến (ví dụ: impact of, efficacy, meta-analysis, case study, literature review, characteristics, v.v.). Tránh các từ giao tiếp thông thường.
4.  **ĐỘ CHÍNH XÁC VỀ Ý ĐỊNH:** Nắm bắt chính xác nhất ý định đằng sau truy vấn gốc tiếng Việt. Nếu mơ hồ, hãy chọn cách diễn giải phổ biến hoặc khả năng cao nhất.
5.  **ĐỊNH DẠNG ĐẦU RA:** Đảm bảo đầu ra là một chuỗi văn bản thuần túy (plain text string) duy nhất, sẵn sàng để sao chép và dán trực tiếp vào thanh tìm kiếm.`;

    const prompt = `Provide the single best English search query translation for the following Vietnamese query. Output ONLY the raw English text, nothing else: ${query}`;

    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: MODEL_NAME_FLASH,
      contents: [prompt],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1 // Low temperature for more deterministic output
      }
    });

    res.json({ text: (response.text || '').trim() });
  } catch (error: unknown) {
    console.error('Translate search query error:', error);
    res.status(500).json({ error: (error instanceof Error ? error.message : 'Lỗi hệ thống khi dịch từ khóa.') });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = 3000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
export { app };
