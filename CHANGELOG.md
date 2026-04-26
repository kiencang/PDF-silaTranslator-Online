# Changelog

Tất cả những thay đổi đáng chú ý của dự án **PDF-silaTranslator-Online** sẽ được ghi lại trong file này.

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
và dự án này tuân thủ [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Riêng chỉ sửa nhỏ giao diện mà không động đến logic dịch thuật sẽ sử dụng thêm giá trị i, k, l... đằng sau.

Ví dụ 1.0.19.i nghĩa là phiên bản này có lõi giống y phiên bản 1.0.19, chỉ có giao diện người dùng là chỉnh sửa nhỏ.

## [1.0.37.c] - 2026-04-26

### Fixed
- Chữa bản lỗi v1.0.37.

## [1.0.37] - 2026-04-26

### Added
- Thêm tính năng bổ sung công cụ tìm kiếm khi dịch bằng AI (grounding with google search).

## [1.0.36] - 2026-04-26

### Fixed
- Thêm tùy chỉnh thiết lập chế độ dịch mặc định.
- Điều chỉnh lại giao diện để hiển thị tốt hơn trên di động.
- Xóa thông tin không cần thiết trên header.

## [1.0.35] - 2026-04-16

### Fixed
- Đặt giới hạn dung lượng HTML 0.5 MB.
- Chỉnh lại một số câu chữ trong giao diện của app.

## [1.0.34] - 2026-04-16

### Fixed
- Chỉnh Temperature khi dịch từ Anh sang Việt lên 0.5 cho phase 2.

## [1.0.33] - 2026-04-15

### Fixed
- Chỉnh nhỏ ở phase 2 để cho AI quyền can thiệp tốt hơn với CSS.

## [1.0.32] - 2026-04-15

### Fixed
- Nâng cấp SI/Prompt lên phiên bản mới (SI phase 2).

## [1.0.31] - 2026-04-15

### Fixed
- Nâng cấp SI/Prompt lên phiên bản mới (SI phase 1).

## [1.0.30] - 2026-04-15

### Fixed
- Thao tác DOM trực tiếp (Anti-pattern trong Angular).
- Quản lý bộ nhớ (Memory Leak) cho một số tác vụ chạy ngầm.

## [1.0.29] - 2026-04-15

### Removed
- Loại bỏ tính năng ghi nhớ lịch sử dịch (ít hữu ích, nhưng lại cản trở luồng thao tác).
- Loại bỏ tính năng ghi nhớ chế độ dịch (dễ gây sai lỗi cho người mới dùng, người dùng quen thì có ích nhưng không đáng kể) => mục tiêu hạn chế lỗi tối đa và giữ tỉnh táo khi chọn chế độ dịch, nên không cần thiết duy trì.
- Tính năng phím tắt cũng gây ảnh hưởng đến luồng thao tác trong khi không có quá nhiều tác dụng với trường hợp dịch thuật (cần thao tác cẩn thận hơn là phải nhanh), ngoài ra tính năng này gia tăng gánh nặng bảo trì => Loại bỏ vì không mấy tác dụng.

### Fixed
- Chuẩn hơn trong việc xử lý khi người dùng chọn các tùy chọn dịch không phù hợp với file tải lên. Ngăn ngừa lỗi ngay ở giao diện thay vì bấm nút dịch rồi mới biết.

## [1.0.28] - 2026-04-15

### Fixed
- Nới ngưỡng tải file PDF lên 10MB.

## [1.0.27] - 2026-04-15

### Fixed
- Chỉnh text 'Thay đổi file' thành 'Chọn file khác'.
- Thêm phím tắt Ctrl + Enter khi muốn dịch để đỡ phải bấm nút.

## [1.0.26] - 2026-04-15

### Fixed
- Điều chỉnh nút 'Thay đổi file' thành dạng dễ bấm hơn.
- Lưu lại tùy chọn dịch gần đây nhất của người dùng.

## [1.0.25] - 2026-04-15

### Fixed
- Điều chỉnh khu vực tải file lên khi hover được rõ nét hơn.
- Gom nhóm dịch 2 phase và một radio button để có cùng logic với 3 kiểu dịch đầu (UX/UI). 

## [1.0.24] - 2026-04-14

### Fixed
- Điều chỉnh tên file SI/Prompt trong thư mục refine thành kiểu đỡ nhầm lẫn hơn (x_svg thành zero_svg). 

## [1.0.23] - 2026-04-14

### Fixed
- Điều chỉnh SI/Prompt lên phiên bản mới nhất. 

## [1.0.22] - 2026-04-13

### Fixed
- Với trường hợp chuyển file PDF sang HTML (phase 1), đôi khi bị gặp vấn đề 'Lỗi Recitation'. 
- Phiên bản này cập nhật thông báo chi tiết cho phản hồi, tránh không thông báo điều gì.











































