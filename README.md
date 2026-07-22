<p align="center">
  <img src="images/app-dich-intro.png" alt="Giao diện của công cụ dịch...">
   <br><em>Một file được dịch bởi công cụ</em>
</p>

Mã nguồn App dịch file PDF từ Anh sang Việt. Triển khai trên AI Studio. Có app sẵn để người dùng cá nhân dùng luôn (mà không cần viết thêm dòng code nào).

- **Link web**: https://pdf-silatranslator.wpsila.com
- **Link app (để tận dụng ngưỡng miễn phí của AI Studio)**: https://aistudio.google.com/apps/bb5c61b7-e110-49aa-933c-04c4ccd18e16?showPreview=true&showAssistant=true
---
- Ở phiên bản mới nhất cần tạo API Key miễn phí trên Gemini và nhập vào ứng dụng để dùng.
- Cập nhật phiên bản online trên Cloudflare.
- Đọc hướng dẫn cách dùng ở đây: https://pdf-translator.wpsila.com
- Chương trình sử dụng SI/Prompt đã được tối ưu sẵn ở dự án này: https://github.com/kiencang/SI-Prompt-PDF-EV-Translate (v1.3.44)

Xem thêm Tuyên bố từ chối trách nhiệm: https://github.com/kiencang/PDF-silaTranslator-Online/blob/main/DISCLAIMERS.md

## Ghi công

Công cụ này được hoàn thành dựa vào nhiều thư viện khác. Một số thư viện quan trọng bao gồm:

### 1. Nền tảng
*   **[Angular](https://angular.dev/)**: Framework Javascript, sản phẩm của Google.
*   **[Tailwind CSS](https://tailwindcss.com/)**: Chịu trách nhiệm chính cho giao diện.
*   **[Lucide Angular](https://lucide.dev/)**: Bộ icon.

### 2. PDF core
*   **[pdf-lib](https://pdf-lib.js.org/)**: Giúp chia tách, cắt ngắn file PDF.
*   **[Mozilla PDF.js](https://mozilla.github.io/pdf.js/)** – Phát triển bởi **Mozilla**. Thư viện chạy hoàn toàn trên Client-side, giúp trích xuất hình ảnh trong file PDF.
