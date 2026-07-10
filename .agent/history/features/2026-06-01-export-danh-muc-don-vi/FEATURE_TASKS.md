# Feature Tasks: Xuất danh mục phòng ban bộ phận

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-06-01

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành

## Phase 1: Core API & Logic Backend

**Mục tiêu:** Xây dựng hàm lấy và format dữ liệu từ sheet `Setup` của file Master.

- [x] Task 1.1: Tạo biến cấu hình ID xuất báo cáo danh mục trong `Code.js` (`GLOBAL_CONFIG.FILES.EXPORT_DANH_MUC_DON_VI`).
- [x] Task 1.2: Tạo file `doGet/doGet_danhMucDonVi.js`.
- [x] Task 1.3: Viết hàm `doGet_getDanhMucDonViData()` trong file mới để fetch data cột K, L từ `MASTER_DATA` -> sheet `Setup`. Xử lý bỏ "DV" và nối chuỗi.
- [x] Task 1.4: Khai báo route `getPrintDanhMucDonVi` và `exportDanhMucDonVi` trong `Code.js`. Lưu ý: route KHÔNG nhận tham số `month`, gọi `handlerInfo.fn()` không truyền month.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Chạy thử hàm xem data trả về đúng định dạng chưa).

## Phase 2: In HTML

**Mục tiêu:** Hoàn thiện chức năng tạo bản in HTML.

- [x] Task 2.1: Thêm hàm `pg1_ed1_getPrintDanhMucDonVi()` vào `client/pg_general_1.js` để frontend lấy data in.
- [x] Task 2.2: Thêm hàm `printDanhMucDonVi()` và `generateDanhMucDonViHtml()` vào `client/pg_general_3.html` (theo pattern `printBangTruKPCDVaCacQuy`). Dùng biến `_L`, `_G`, `_S` đã khai báo sẵn. Không cần kiểm tra tháng.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Test tính năng in trên UI hiển thị đúng bảng mẫu).

## Phase 3: Xuất Excel

**Mục tiêu:** Hoàn thiện chức năng tạo file Excel.

- [x] Task 3.1: Viết hàm `doGet_taoBangDanhMucDonViExcel()` trong `doGet/doGet_danhMucDonVi.js` để ghi data vào template Sheet và trả về link tải Excel. Bắt buộc set `.setNumberFormat('@')` (text format) cho cột Mã đơn vị để giữ số 0 đầu.
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (Test API xuất Excel chạy không lỗi).

## Phase 4: Tích hợp UI

**Mục tiêu:** Thêm nút xuất và luồng tương tác cho người dùng.

- [x] Task 4.1: Viết hàm `pg_general_4_exportDanhMucDonVi()` trong `client/pg_general_4.html` sử dụng SweetAlert2 cho phép chọn In hoặc Xuất Excel. KHÔNG kiểm tra tháng, KHÔNG hiển thị dropdown chọn tháng.
- [x] Task 4.2: Đặt nút (Button) "Danh mục đơn vị" vào `client/pg_general_2.html` (nhóm "Khác"). Nút hoạt động bình thường dù chưa chọn tháng.
- [x] Task 4.Final: 🧪 Test & Verify Phase 4 (Test End-to-End toàn bộ tính năng).

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-06-01 14:48 | Phase 1 | Task 1.1 | Bắt đầu cấu hình biến trong Code.js | start | |
| 2026-06-01 14:50 | Phase 1 | Task 1.1 | Cấu hình xong biến EXPORT_DANH_MUC_DON_VI | done | |
| 2026-06-01 14:51 | Phase 1 | Task 1.2 | Bắt đầu tạo file doGet_danhMucDonVi.js | start | |
| 2026-06-01 14:55 | Phase 1 | Task 1.2, 1.3, 1.4 | Tạo file, viết hàm doGet_getDanhMucDonViData, đăng ký route và proxy | done | |
| 2026-06-01 14:56 | Phase 1 | Task 1.Final | Bắt đầu tự test và xác minh backend | start | |
| 2026-06-01 15:00 | Phase 1 | Task 1.Final | Xác nhận backend chạy thành công trên Apps Script | done | |
| 2026-06-01 15:01 | Phase 2 | Task 2.1 | Bắt đầu thêm pg1_ed1_getPrintDanhMucDonVi vào client/pg_general_1.js | start | |
| 2026-06-01 15:05 | Phase 2 | Task 2.1 | Thêm pg1_ed1_getPrintDanhMucDonVi xong | done | |
| 2026-06-01 15:06 | Phase 2 | Task 2.2 | Bắt đầu thiết kế in HTML trong client/pg_general_3.html | start | |
| 2026-06-01 15:09 | Phase 2 | Task 2.2 | Hoàn thiện printDanhMucDonVi và generateDanhMucDonViHtml | done | |
| 2026-06-01 15:10 | Phase 2 | Task 2.Final | Bắt đầu deploy và kiểm tra in HTML | start | |
| 2026-06-01 15:15 | Phase 3 | Task 3.1 | Viết hàm doGet_taoBangDanhMucDonViExcel | done | |
| 2026-06-01 15:20 | Phase 4 | Task 4.1, 4.2 | Thêm logic hiển thị SweetAlert và tích hợp nút bấm vào client/pg_general_2.html | done | |
| 2026-06-01 15:25 | Phase 4 | Task 4.Final | Hoàn tất tích hợp toàn bộ tính năng và bàn giao | done | |
