# Feature Tasks: Thêm chức năng Trừ KPCĐ và Các quỹ

> **Trạng thái**: 🔄 Đang thực hiện
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-04-28

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: UI & Routing Update

**Mục tiêu:** Cập nhật giao diện người dùng và đăng ký route API mới.

- [x] Task 1.1: Thêm section "Chức năng khác" và card "Trừ KPCĐ và Các quỹ" vào `client/pg_general_2.html`.
- [x] Task 1.2: Thêm hàm `pg_general_4_exportBangTruKPCDVaCacQuy` vào `client/pg_general_4.html`.
- [x] Task 1.3: Thêm route `taoBangTruKPCDVaCacQuy` vào `ROUTE_MAP` trong `doGet/Code.js`.
- [x] Task 1.4: Thêm ID file xuất báo cáo vào `GLOBAL_CONFIG` trong `doGet/Code.js` (Sử dụng ID hiện có hoặc tạo mới nếu có thông tin).
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Kiểm tra nút bấm và dialog hiện ra đúng).

## Phase 2: Backend Logic Implementation

**Mục tiêu:** Triển khai logic tổng hợp dữ liệu từ DataLuong1 và các nguồn liên quan.

- [ ] Task 2.1: Tạo file `doGet/doGet_tongHopTruKPCDVaCacQuy.js`.
- [ ] Task 2.2: Triển khai hàm `doGet_tongHopTruKPCDVaCacQuy` lấy dữ liệu từ `DataLuong1`.
- [ ] Task 2.3: Implement logic mapping cột: "Trừ KPCĐ" -> KPCĐ, "Trừ khác" -> Quỹ tình nghĩa.
- [ ] Task 2.4: Triển khai logic sắp xếp theo "Mã đơn vị" lấy từ `DataChotNSThang`.
- [ ] Task 2.Final: 🧪 Test & Verify Phase 2 (Kiểm tra dữ liệu thô trả về qua API/Logger).

## Phase 3: Report Formatting & Direct Print

**Mục tiêu:** Hoàn thiện định dạng file Excel/PDF và tích hợp chức năng in.

- [ ] Task 3.1: Triển khai logic ghi dữ liệu vào Spreadsheet (headers, styles, borders, signatures).
- [ ] Task 3.2: Implement hàm `getPrintDataTruKPCDVaCacQuy` để hỗ trợ in trực tiếp từ Client.
- [ ] Task 3.3: Tinh chỉnh CSS/Template để báo cáo giống mẫu trong ảnh.
- [ ] Task 3.Final: 🧪 Test & Verify Phase 3 (Kiểm tra file xuất ra và bản in cuối cùng).

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-04-28 21:30 | Phase 1 | Khởi tạo | Tạo plan và tasks | done | |
| 2026-04-28 21:32 | Phase 1 | Task 1.1 | Bắt đầu thêm UI | start | |
| 2026-04-28 21:34 | Phase 1 | All | Hoàn thành UI và Routing | done | Đã thêm UI, Route và Config |
