# Feature Tasks: Hệ thống Đa Báo cáo & Danh mục Báo cáo

> **Trạng thái**: 🔄 Đang thực hiện
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-04-13

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: UI & Routing Enhancement

**Mục tiêu:** Chuẩn bị giao diện và hạ tầng API để hỗ trợ nhiều loại báo cáo.

- [x] Task 1.1: Cập nhật `client/index.html` để thêm 4 loại báo cáo mới vào dropdown `#report-type-filter`.
- [x] Task 1.2: Cập nhật `doget/doGet.gs` để tiếp nhận tham số `reportType` từ request và chuyển tiếp vào `getReportData`.
- [x] Task 1.3: Cập nhật `client/scripts.html` để gửi kèm `reportType` khi gọi API lấy dữ liệu báo cáo.
- [/] Task 1.Final: 🧪 Test & Verify Phase 1: Đảm bảo khi chọn loại báo cáo khác nhau, Backend nhận đúng tham số (kiểm tra qua Execution Log của GAS).

## Phase 2: Core Report Logic Implementation

**Mục tiêu:** Hiện thực hóa logic tính toán cho 4 loại báo cáo mới trong Backend.

- [ ] Task 2.1: Triển khai logic Báo cáo 2.2 (Bán mới) trong `Service_Report_Engine.gs`.
- [ ] Task 2.2: Triển khai logic Báo cáo 2.3 (Bán lại) trong `Service_Report_Engine.gs`.
- [ ] Task 2.3: Triển khai logic Báo cáo 2.4 (Phụ BS) trong `Service_Report_Engine.gs`.
- [ ] Task 2.4: Triển khai logic Báo cáo 2.5 (Giới thiệu) trong `Service_Report_Engine.gs`.
- [ ] Task 2.5: Cập nhật `architecture/MASTER.md` để ghi nhận các logic đã triển khai.
- [ ] Task 2.Final: 🧪 Test & Verify Phase 2: Kiểm tra tính chính xác của dữ liệu cho từng loại báo cáo so với file Excel mẫu.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-04-13 22:05 | Phase 0 | Plan | Khởi tạo kế hoạch | done | Sẵn sàng cho review |
| 2026-04-13 22:05 | Phase 1 | Task 1.1 | Bắt đầu cập nhật UI dropdown | start | |
| 2026-04-13 22:06 | Phase 1 | Task 1.1 | Đã thêm 5 tùy chọn báo cáo vào dropdown | done | |
| 2026-04-13 22:06 | Phase 1 | Task 1.2 | Bắt đầu cập nhật API routing | start | |
| 2026-04-13 22:07 | Phase 1 | Task 1.2 | Đã cập nhật `getReportData` để rẽ nhánh loại báo cáo | done | |
| 2026-04-13 22:07 | Phase 1 | Task 1.3 | Bắt đầu cập nhật Frontend API call | start | |
| 2026-04-13 22:08 | Phase 1 | Task 1.3 | Đã xác nhận code frontend đã gửi kèm `reportType` | done | |
| 2026-04-13 22:08 | Phase 1 | Task 1.Final | Thực hiện self-test chuyển đổi loại báo cáo | start | |
