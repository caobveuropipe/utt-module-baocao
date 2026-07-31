# Backend Changelog - Module Hạch Toán Lương & Truy Lĩnh

## [2026-07-31] Hạch toán HĐ ngắn hạn trực tiếp & Sửa dấu KPCĐ

### Added
- **Dòng "Tổng truy lĩnh HĐ N.hạn-TT"**: Thêm dòng mới để hạch toán truy lĩnh cho hợp đồng ngắn hạn Trực tiếp, đồng thời khấu trừ khoản này khỏi tổng Trực tiếp (`sumTotalTT`) tương tự như gián tiếp, và cập nhật lại tính toán `totalA`.

### Changed
- **Sửa dấu Kinh phí Công đoàn (doGet_hachToanKPCD.js)**: Chuyển đổi công thức tính dòng Cộng từ `Lương - Truy lĩnh + Truy thu` thành `Lương + Truy lĩnh - Truy thu` để đồng bộ đúng logic tính toán với bảng Bảo hiểm.
- **Tiêu đề cột**: Đổi tiêu đề `"SỐTT"` thành `"SỐ TT"` trong bảng hạch toán Kinh phí Công đoàn.

## [2026-07-31] Tách cột PCTN thành PC TN và PC TV

### Changed
- **Logic bóc tách phụ cấp:** Tách biệt Phụ cấp trách nhiệm (`HSTrachNhiem * LCB` -> `s.PCTN`) và Phụ cấp tự vệ (`HSTuVe * LCB` -> `s.PCTV`) thay vì gộp chung trong cả hai luồng xử lý `DataLuong1` và `TruyThu1`.
- **Kết xuất bảng tính Excel:** Cấu trúc lại bảng `THHachToanLuong` từ 21 thành 22 cột, thêm cột `PC TV` và cập nhật lại dải ghép ô (merge ranges) tiêu đề.

## [2026-07-30] Bổ sung logic tính toán Treo Lương

### Added
- **Đọc Trạng thái Nhân sự:** Hỗ trợ index và đọc cột `Trạng thái` (`TrangThai`) từ sheet chốt nhân sự `DataChotNSThang` trong cả 2 hàm `test_chiTietThanhPhanHachToanLuong` và `doGet_processHachToanLuongVaTruyLinh`.
- **Tính toán Treo Lương:** Tự động phát hiện nhân sự thuộc diện treo lương theo quy tắc `isTreoLuong = (kv === 'Phú Thọ' && (trangThai === 'Đi NN' || trangThai === 'Đi công tác NN'))` và tích lũy số tiền `Tổng lương 1` (Còn lĩnh) từ `DataLuong1` vào cột `Treo lương` của bảng hạch toán.

## [2026-07-26] Nâng cấp logic bóc tách Hạch toán lương và Truy lĩnh lương

### Added
- **Hàm Test & Audit chi tiết**: `test_chiTietThanhPhanHachToanLuong(monthStr, location)` trong `doGet_hachToanLuongVaTruyLinh.js` giúp bóc tách từng thành phần dữ liệu và ghi kết quả ra Sheet `Audit_HachToanLuong` trong file Spreadsheet `EXPORT_HT_TH_LUONG_VA_TTTL`.
- **Hàm đối chiếu dữ liệu mới**: Thêm tệp `doGet_doiChieuDuLieu.js` hỗ trợ đối chiếu thông tin nhân sự và lương.

### Changed
- **Đồng bộ Lọc Khu vực**: Áp dụng bộ lọc địa phương (Hà Nội / Phú Thọ) tự động tra cứu từ `DataChotNSThang` cho toàn bộ các nguồn dữ liệu: `DataLuong1`, `TruyThu1`, `DataLuong2`, `TruyThu2`, `DataAnCa`.
- **Logic Truy lĩnh Lương CĐ**: Tự động so sánh cột AE (`Lương CĐ`) trong `DataLuong1` với giá trị Lương CĐ đã chốt trong `DataChotNSThang`. Nếu nhỏ hơn, phần chênh lệch sẽ tự động đưa vào mục **II. Truy thu, truy lĩnh**.
- **Quy tắc đọc TruyThu1**: Lọc theo khu vực và sử dụng cột `Còn nhận` (AH) để phân loại thành **Truy lĩnh** (`> 0`) hoặc **Truy thu** (`< 0`) chi tiết cho từng loại hợp đồng (Biên chế, HĐ 68, HĐ khác).
- **Hoàn thiện cấu trúc Bảng kê**: Bổ sung đầy đủ các mục tổng hợp B (Thu nhập tăng thêm), C (Ăn ca), D (Thuế TNCN) và dòng Tổng cộng (A+B+C-D) ở cả hàm test và hàm xử lý sản xuất.
