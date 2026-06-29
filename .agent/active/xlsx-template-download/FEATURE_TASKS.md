# Feature Tasks: Tải mẫu Upload Excel (.xlsx)

> **Trạng thái**: 🔄 Đang thực hiện
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-04-19

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Giao diện và Logic Tải mẫu

**Mục tiêu:** Người dùng có thể tải file template .xlsx chuẩn từ UI.

- [x] Task 1.1: Định nghĩa danh sách cột chuẩn (headers) trong `client/scripts.html`.
- [x] Task 1.2: Viết hàm `downloadUploadTemplate()` sử dụng thư viện `XLSX` để xuất file.
- [x] Task 1.3: Cập nhật hàm `openUploadModal()` để thêm nút "Tải mẫu Excel" vào giao diện SweetAlert2.
- [x] Task 1.4: Thêm CSS styling (nếu cần) để nút Tải mẫu trông chuyên nghiệp và nổi bật.
- [/] Task 1.Final: 🧪 Test & Verify Phase 1: Tải file, kiểm tra nội dung và thử upload.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| [2026-04-19] | Phase 1 | Setup | Khởi tạo kế hoạch | done | Sẵn sàng triển khai |
| [2026-04-19 10:45] | Phase 1 | Task 1.1-1.4 | Triển khai logic và UI cho nút tải mẫu | done | Bao gồm sample row và header chuẩn |
| [2026-04-19 10:45] | Phase 1 | Task 1.Final | AI self-test code logic và mapping header | start | |
