# Backend Changelog - Module Hạch Toán Lương & Truy Lĩnh

## [2026-07-26] Nâng cấp logic bóc tách Hạch toán lương và Truy lĩnh lương

### Added
- **Hàm Test & Audit chi tiết**: `test_chiTietThanhPhanHachToanLuong(monthStr, location)` trong `doGet_hachToanLuongVaTruyLinh.js` giúp bóc tách từng thành phần dữ liệu và ghi kết quả ra Sheet `Audit_HachToanLuong` trong file Spreadsheet `EXPORT_HT_TH_LUONG_VA_TTTL`.
- **Hàm đối chiếu dữ liệu mới**: Thêm tệp `doGet_doiChieuDuLieu.js` hỗ trợ đối chiếu thông tin nhân sự và lương.

### Changed
- **Đồng bộ Lọc Khu vực**: Áp dụng bộ lọc địa phương (Hà Nội / Phú Thọ) tự động tra cứu từ `DataChotNSThang` cho toàn bộ các nguồn dữ liệu: `DataLuong1`, `TruyThu1`, `DataLuong2`, `TruyThu2`, `DataAnCa`.
- **Logic Truy lĩnh Lương CĐ**: Tự động so sánh cột AE (`Lương CĐ`) trong `DataLuong1` với giá trị Lương CĐ đã chốt trong `DataChotNSThang`. Nếu nhỏ hơn, phần chênh lệch sẽ tự động đưa vào mục **II. Truy thu, truy lĩnh**.
- **Quy tắc đọc TruyThu1**: Lọc theo khu vực và sử dụng cột `Còn nhận` (AH) để phân loại thành **Truy lĩnh** (`> 0`) hoặc **Truy thu** (`< 0`) chi tiết cho từng loại hợp đồng (Biên chế, HĐ 68, HĐ khác).
- **Hoàn thiện cấu trúc Bảng kê**: Bổ sung đầy đủ các mục tổng hợp B (Thu nhập tăng thêm), C (Ăn ca), D (Thuế TNCN) và dòng Tổng cộng (A+B+C-D) ở cả hàm test và hàm xử lý sản xuất.
