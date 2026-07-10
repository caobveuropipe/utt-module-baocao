# Feature Tasks - Sửa lỗi lệch cột và NaN trong Bảng Chuyển khoản (ATM)

**Trạng thái:** ✅ Hoàn thành

## Phase 1: Chuẩn hóa cấu trúc Table Header (HTML)
- [x] **Task 1.1**: Cập nhật `colgroup` trong `pg_general_3.html` để có đủ 15 cột (hiện tại thiếu 1 cột cuối). Điều chỉnh chiều rộng các cột để vừa khít trang A4 Landscape.
- [x] **Task 1.2**: Đảm bảo dòng header đầu tiên (`tr`) có đủ 6 cột `rowspan="3"` (STT, Mã CB, Họ và tên, Số tài khoản, Tên ngân hàng, Tổng ATM) trước khi đến cột "Trong đó".
- [x] **Task 1.3**: Đảm bảo dòng nhãn (A, B, C, D, E, 1, 2...) có đủ 15 nhãn.
- [x] **Task 1.4**: Cập nhật các dòng `colspan="14"` thành `colspan="15"`.
- [x] **Task 1.5**: 🧪 Test & Verify Phase 1: Kiểm tra giao diện bảng in xem đã đủ cột chưa.

## Phase 2: Cải thiện Logic định dạng và tính toán
- [x] **Task 2.1**: Cập nhật hàm `fmt(v)` trong `pg_general_3.html` để xử lý trường hợp `Number(v)` là `NaN` (trả về chuỗi gốc hoặc "0").
- [x] **Task 2.2**: Kiểm tra lại dòng Tổng cộng (dòng cuối) xem có bị lệch cột không.
- [x] **Task 2.3**: 🧪 Test & Verify Phase 2: Kiểm tra xem lỗi `NaN` đã hết chưa.

## Phase 3: Audit Backend (Google Apps Script)
- [x] **Task 3.1**: Kiểm tra lại hàm `doGet_tongHopDiNganHang` trong `doGet/doGet_tongHopCk.js` để đảm bảo logic `tong` không thể sinh ra `NaN`.
- [x] **Task 3.2**: Đảm bảo `getPrintDataCk` tính toán `totalAll` và `totals` một cách an toàn.
- [x] **Task 3.3**: 🧪 Test & Verify Phase 3: Chạy test function backend để kiểm tra dữ liệu trả về.

## Execution Log
- [2026-04-28] Khởi tạo kế hoạch sửa lỗi.
- [2026-04-28] Phase 1 - Task 1.1: Bắt đầu cập nhật cấu trúc bảng.
- [2026-04-28] Hoàn thành Phase 1 và Phase 2 (Cập nhật HTML và JS frontend).
- [2026-04-28] Hoàn thành Phase 3 và chốt Feature.



