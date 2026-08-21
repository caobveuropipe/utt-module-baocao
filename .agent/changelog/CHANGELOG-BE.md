# Backend Changelog - Module Hạch Toán Lương & Truy Lĩnh

## [2026-08-21] Chuẩn hóa cột lấy dữ liệu TTTL & Loại bỏ dòng 0 khi xuất Excel

### Fixed
- **Chuẩn hóa cột đọc dữ liệu Truy Thu Lĩnh (`doGet_tongHopExcel.js`)**: Cập nhật hàm `processTTL` bắt buộc đối chiếu kỳ lương qua duy nhất cột `Kỳ trả lương` và ưu tiên lấy số tiền từ cột `Còn nhận` (cột AH) trong sheet `DataTruyThuLinh` áp dụng cho cả File Truy Thu Lương 1 & 2.

### Added
- **Bộ lọc loại bỏ nhân sự không phát sinh thu nhập (`doGet_tongHopExcel.js`)**: Tự động lọc bỏ các cán bộ ra khỏi file Excel xuất ra nếu đồng thời cả 6 khoản thu nhập/trừ (Tổng lương 1, Lương 2, Tạm giữ, Ăn ca, TTTL L1, TTTL L2) đều bằng 0.

## [2026-08-21] Bổ sung Ngày công tác & BHXH TTTL vào bảng lương Excel (56 cột)

### Added
- **Tách 3 cột Ngày công tác (`doGet_tongHopExcel.js`)**: Bổ sung hàm `parseWorkDates(val)` phân tách chuỗi ngày công tác `NgayBienChe|NgayVaoNganh|NgayKTHD` từ `DataChotNSThang` (cột AR) thành 3 cột riêng biệt: `Ngày vào biên chế`, `Ngày vào ngành`, `Ngày kết thúc hợp đồng` (định dạng `yyyy-mm-dd`).
- **Trích xuất 4 khoản BHXH-TTTL (`doGet_tongHopExcel.js`)**: Nâng cấp hàm `processTTL` đọc thêm 4 cột `BHXH`, `BHYT`, `BHTN`, `KPCĐ` từ sheet `DataTruyThuLinh` (Lương 1) và cộng dồn với hậu tố `-TTTL`: `BHXH-TTTL`, `BHYT-TTTL`, `BHTN-TTTL`, `KPCĐ-TTTL`.
- **Mở rộng bảng Excel sang 56 cột**: Mở rộng mảng `headers` và mapping `rows` từ 49 cột lên 56 cột, hoàn thiện cấu trúc dữ liệu xuất file Excel tổng hợp lương.

## [2026-08-20] Hỗ trợ Bảng treo lương Phú Thọ (In & Xuất Excel) và xóa dòng trắng thừa

### Added
- **Cờ `isTreoLuong` cho Bảng chuyển khoản (`doGet_tongHopCk.js`, `Code.js`)**:
  - `doGet_tongHopDiNganHang`: Hỗ trợ tham số `isTreoLuong`. Khi bật tại cơ sở Phú Thọ, hàm chỉ giữ lại các nhân sự có trạng thái `Đi công tác NN` hoặc `Đi NN`.
  - `getPrintDataCk` & `pg1_ed1_getPrintDataCk`: Hỗ trợ truyền cờ `isTreoLuong` để phục vụ render dữ liệu in ấn.
  - `doGet_taoBangTongHopCk`: Xuất file Excel Bảng treo lương với tiêu đề ô A3 đổi thành `DANH SÁCH TREO CHƯA CHI TRẢ TIỀN LƯƠNG`, chữ ký đổi thành `Phụ trách kế toán` và xóa `Phần dành cho ngân hàng`.

### Fixed
- **Triệt tiêu trang trắng thừa khi xuất Excel (`doGet_tongHopCk.js`)**:
  - `clearRange` triệt để toàn bộ nội dung và định dạng cũ từ dòng `START_ROW` đến hết `maxRows`.
  - Tự động xóa các hàng trống phía sau phần chữ ký (`deleteRows(finalLastRow + 1, currentMaxRows - finalLastRow)`) giúp file Excel/PDF ôm khít dữ liệu.

## [2026-08-20] Chuẩn hóa cấu trúc 4 nhóm Bảng phân bổ tiền lương & BHXH

### Added
- **Cấu trúc 4 nhóm La Mã (`doGet_phanBoLuongBHXH.js`)**: 
  - `I. BIÊN CHẾ`: Gồm `1. Bộ phận quản lý` (chi tiết *Trong đó:*, *Cộng bộ phận quản lý*), `2. Bộ phận trực tiếp`, chốt bằng `CỘNG BIÊN CHẾ`.
  - `II. HỢP ĐỒNG DÀI HẠN`: Phân chia theo `1. Bộ phận quản lý`, `2. Bộ phận trực tiếp`.
  - `III. HỢP ĐỒNG 68`: Nhánh độc lập gồm `Gián tiếp` và `Trực tiếp`, kèm dòng tổng gộp `CỘNG HĐDH + HĐ 68` (display-only).
  - `IV. HỢP ĐỒNG VỤ VIỆC`: Phân chia `Gián tiếp` và `Trực tiếp`, hiển thị chi tiết các tổ dưới mục *Trong đó:* và chốt bằng `CỘNG HĐ VỤ VIỆC`.
- **Hàm Audit bóc tách cán bộ**: Nâng cấp `auditChiTietPhanBoLuongBHXH()` đồng bộ 4 nhóm mới, xuất chi tiết từng Mã CB và dòng phân bổ tương ứng ra Sheet `Audit_PhanBoLuongBHXH`.

### Changed
- **Chuẩn hóa Mã Đơn Vị**: Tự động chuẩn hóa tiền tố `DV` cho mã đơn vị từ `DataChotNSThang` để tra cứu chính xác trong `Setup!K:O`.
- **Thuật toán làm tròn cấp nhóm**: Cộng dồn số liệu thô trước, làm tròn từng khoản tiền đến hàng đơn vị (`Math.round`) tại cấp nhóm/tổ, sau đó cộng dồn lên các cấp tổng con và `Tổng cộng` để triệt tiêu hoàn toàn sai số 1 đồng.
- **Format Sheets**: Áp dụng bôi đậm (Bold) và kẻ viền nét liền (Solid bottom border) case-insensitive cho tất cả các dòng `CỘNG...`.

## [2026-08-18] Sửa bóc tách phụ cấp Bảng tổng hợp lương & Đồng bộ Lương cơ sở động

### Fixed
- **Bóc tách phụ cấp (`doGet_tongHopLuong.js`)**: Đưa các lệnh cộng dồn hệ số phụ cấp (`hsNganh`, `hsDDocHai`, `hsTrachNhiem`, `hsTuVe`) vào bên trong khối điều kiện `isCurrentMonth`. Ngăn chặn việc nhân sự fallback từ tháng trước bị tính nhầm hệ số phụ cấp vào tháng hiện tại, giúp chỉ tiêu *1.1 Lương + Truy lĩnh, truy thu* và *1.2 Phụ cấp giáo viên* khớp hoàn toàn với Bảng thanh toán đi Ngân hàng / Kho bạc ([ThuyetMinhL1](file:///d:/Project/UoTT/Dikhobac/ThuyetMinhL1)).
- **Khấu trừ Phụ cấp tự vệ Biên chế (`doGet_tongHopLuong.js`)**: Bổ sung `pcTuVe` vào danh sách các khoản phụ cấp cần trừ khỏi tổng lương để ra đúng số tiền Lương ngạch bậc `row1_1_data`.

### Added
- **Đồng bộ Lương cơ sở động (`Code.js`, `ThuyetMinhL1/doGet/Code.js`)**: Bổ sung hàm `getSalaryHistoryFromSheet` và `getLuongCoSoByMonth(monthStr)` tra cứu từ sheet `SetupLuong`, thay thế các giá trị hardcode `2.340.000` cũ bằng hàm tính động theo từng kỳ lương.

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
