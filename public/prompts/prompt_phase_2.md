<main_task>
**LỆNH THỰC THI CHÍNH:** 
Dựa trên vai trò và toàn bộ quy tắc đã được nạp trong **System Instructions (SI)**, hãy tiếp nhận tài liệu đầu vào và thực hiện:
1.  Dịch thuật toàn bộ nội dung sang tiếng Việt.
2.  Tái tạo tài liệu dưới dạng một tệp HTML/CSS hoàn chỉnh: Đây là một mã HTML đã chuẩn. Tuyệt đối giữ nguyên cấu trúc thẻ và thuộc tính. Ngoại lệ: chỉ điều chỉnh nếu điều đó chắc chắn giúp chất lượng bản dịch và khả năng hiển thị tốt hơn.
</main_task>

<strict_compliance_recall>
**[A] KÍCH HOẠT BỘ NHỚ HỆ THỐNG (TUÂN THỦ NGHIÊM NGẶT):**
Hãy gọi lại và áp dụng tuyệt đối **"Hệ thống Thứ tự Ưu tiên (1-4)"** và **"Quy tắc Giải quyết Xung đột"** trong SI:
*   **[#1 & #1A]** Ý nghĩa chính xác 100% & Chuẩn hóa thuật ngữ học thuật.
*   **[#2]** Tiếng Việt tự nhiên và trôi chảy (BẮT BUỘC phá vỡ và tái cấu trúc câu quyết liệt để thoát ly ngữ pháp tiếng Anh).
*   **[#3]** HTML hiển thị hoàn hảo, không vỡ layout, font chữ nội dung chính đủ lớn để đọc.
*   **[#4]** Bảo toàn định dạng gốc ở mức nỗ lực tối đa (Best-effort).
</strict_compliance_recall>

<technical_checklist>
**[B] CHECKLIST KỸ THUẬT QUAN TRỌNG:**
*   **Cột & Layout:** Ép luồng văn bản chính về **1 CỘT DUY NHẤT**.
*   **Công thức Toán học:** Giữ nguyên dấu chấm `.` thập phân bên trong block LaTeX.
*   **Tài liệu tham khảo (References):** KHÔNG DỊCH các thành phần nhận diện (Tác giả, Tên sách/báo, Tạp chí, DOI, URL...). Giữ nguyên định dạng gốc.
*   **Hình ảnh:** Thẻ `<img>` phải có `alt` text tiếng Việt có ý nghĩa.
*   **Tối ưu thiết kế cho màn hình lớn**: Bản dịch cuối cùng có khả năng đọc được trên nhiều kích cỡ màn hình khác nhau, nhưng kích cỡ màn hình lớn (trên laptop/desktop) vẫn là ưu tiên cao nhất.
*   **Giữ nguyên mã Kỹ thuật**: TUYỆT ĐỐI KHÔNG thay đổi, không rút gọn, và không dịch bất kỳ nội dung nào bên trong khối `<style>...</style>`, thẻ `<script>`, và các thuộc tính class/id của thẻ HTML. Chỉ dịch văn bản hiển thị cho người dùng.
    *   **Ngoại lệ:** Cho phép bổ sung CSS khi cần (ví dụ làm font chữ nhỏ hơn ở một số chỗ để chống che lấp nhau, v.v..) nếu điều đó chắc chắn giúp cải thiện chất lượng bản dịch cuối cùng.
</technical_checklist>

<internal_quality_assurance>
**[C] BƯỚC TỰ ĐỐI SOÁT VÀ TINH CHỈNH (Internal QA - Thực hiện ngầm):**
Trước khi xuất kết quả cuối cùng, tự kiểm tra nội bộ:
1.  *Xây dựng Bảng thuật ngữ ngầm (Mental Glossary):* Trước khi xuất mã HTML, hãy tự quét nhanh văn bản, tạo một Bảng thuật ngữ ngầm trong suy nghĩ cho các từ khóa chuyên ngành quan trọng. Đảm bảo áp dụng chúng giống nhau 100% từ trên xuống dưới để tránh lỗi bất nhất.
2.  *Văn phong đã đủ tự nhiên, trôi chảy chưa hay vẫn còn "mùi" dịch máy (word-by-word)?* -> Tự động sửa lại câu từ nếu thấy gượng gạo.
3.  *Mã HTML có rủi ro tràn lề (overflow), các văn bản che lấp nhau, hoặc cấu trúc thẻ sai logic không?* -> Tự động tối ưu lại CSS/HTML.
4.  Khi dịch các thẻ `<text>` bên trong mã `<svg>`: Đảm bảo từ tiếng Việt không quá dài làm vỡ bố cục hình vẽ gốc. Nếu cần, tự động điều chỉnh nhẹ các thuộc tính tọa độ x, y hoặc thêm `text-anchor="middle"` để chữ được căn giữa chuẩn xác.
</internal_quality_assurance>

<output_constraints>
**[D] ĐỊNH DẠNG ĐẦU RA BẮT BUỘC (STRICT OUTPUT BOUNDARY):**
*   Chỉ trả về MÃ HTML THÔ.
*   Bắt đầu chính xác bằng `<!DOCTYPE html>` và kết thúc bằng `</html>`.
</output_constraints>