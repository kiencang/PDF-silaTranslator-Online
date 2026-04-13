<main_task>
**LỆNH THỰC THI CHÍNH:** 
Dựa trên vai trò và toàn bộ quy tắc đã được nạp trong **System Instructions (SI)**, hãy tiếp nhận tài liệu đầu vào và thực hiện:
1.  TẬP TRUNG hoàn toàn vào nhiệm vụ TÁI TẠO tài liệu dưới dạng một tệp HTML/CSS hoàn chỉnh.
2.  GIỮ NGUYÊN toàn bộ nội dung gốc tiếng Anh.
</main_task>

<strict_compliance_recall>
**[A] KÍCH HOẠT BỘ NHỚ HỆ THỐNG (TUÂN THỦ NGHIÊM NGẶT):**
Hãy gọi lại và áp dụng tuyệt đối **"Thứ tự Ưu tiên KHÔNG THAY ĐỔI"** trong SI:
*   **[#1]** HTML hiển thị hoàn hảo, không vỡ layout, font chữ nội dung chính đủ lớn để đọc.
*   **[#2]** Bảo toàn định dạng gốc ở mức nỗ lực tối đa (Best-effort).
</strict_compliance_recall>

<technical_checklist>
**[B] CHECKLIST KỸ THUẬT QUAN TRỌNG:**
*   **Cột & Layout:** Ép luồng văn bản chính về **1 CỘT DUY NHẤT**.
*   **Bảng biểu:** BẮT BUỘC bọc mọi `<table>` bằng `<div class="table-wrapper">` (áp dụng CSS cơ sở trong SI) để chống tràn ngang.
*   **Công thức Toán học:** Phải dùng cú pháp LaTeX `\(\)` và `\[\]`. BẮT BUỘC nhúng thẻ `<script>` MathJax vào `<head>`. (Giữ nguyên dấu chấm `.` thập phân bên trong block LaTeX).
*   **TUYỆT ĐỐI KHÔNG** bọc các cú pháp LaTeX (cả `\( \)` và `\[ \]`) bên trong các thẻ HTML như `<code>` hay `<pre>`.
*   **Tài liệu tham khảo (References):** Giữ nguyên định dạng gốc.
*   **Hình ảnh:** Thẻ `<img>` phải có `alt` text tiếng Anh có ý nghĩa.
*   **Xử lý "câu gãy" do PDF (Line breaks):** Tự động nhận diện và ghép nối (merge) các câu bị ngắt dòng vật lý do giới hạn trang PDF thành một câu hoàn chỉnh trong thẻ `<p>`.
*   **Header/Footer PDF:** Tự động nhận diện và loại bỏ/gom nhóm các Header/Footer bị chèn ngang làm đứt gãy đoạn văn gốc, đảm bảo tính liên tục của đoạn văn bản.
*   **Tối ưu thiết kế cho màn hình lớn:** Bản HTML/CSS cuối cùng có khả năng đọc được trên nhiều kích cỡ màn hình khác nhau, nhưng kích cỡ màn hình lớn (trên laptop/desktop) vẫn là ưu tiên cao nhất.
</technical_checklist>

<internal_quality_assurance>
**[C] BƯỚC TỰ ĐỐI SOÁT VÀ TINH CHỈNH (Internal QA - Thực hiện ngầm):**
Trước khi xuất kết quả cuối cùng, tự kiểm tra nội bộ:
1.  *Mã HTML có rủi ro tràn lề (overflow)?*
2.  *Các văn bản khi hiển thị có che lấp nhau?* 
3.  *Cấu trúc thẻ sai logic không?* 
Nếu có vấn đề hãy Tự động tối ưu lại CSS/HTML.
</internal_quality_assurance>

<output_constraints>
**[D] ĐỊNH DẠNG ĐẦU RA BẮT BUỘC (STRICT OUTPUT BOUNDARY):**
*   Chỉ trả về MÃ HTML THÔ.
*   Bắt đầu chính xác bằng `<!DOCTYPE html>` và kết thúc bằng `</html>`.
</output_constraints>