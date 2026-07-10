# Feature Tasks: Đồng bộ số trang và gom nhóm chữ ký bản in

> **Trạng thái**: 🔄 Đang thực hiện
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-06-26

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Triển khai kỹ thuật cho Bảng tổng hợp lương

**Mục tiêu:** Định dạng in Portrait và gom cụm dòng Tổng cộng + chữ ký cho `generateLuongHtml`.

- [x] Task 1.1: Sửa đổi CSS `@page` trong `generateLuongHtml` trong [pg_general_3.html](file:///d:/Project/UoTT/Dikhobac/client/pg_general_3.html) để in A4 dọc và thêm chân trang hiển thị số trang.
- [x] Task 1.2: Gán class `row-total` cho dòng Tổng cộng khi duyệt data in trong `generateLuongHtml`.
- [x] Task 1.3: Thêm cấu hình ngắt trang tránh mồ côi (`break-after: avoid`, `break-inside: avoid`, `break-before: avoid`) và bọc block chữ ký trong `.sig-section-wrapper` tương tự như `generateCkHtml`.
- [/] Task 1.Final: 🧪 Test & Verify Phase 1 (Xem trước in ấn, kiểm tra sự tồn tại của số trang và ngắt trang gom khối)

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-06-26 12:55 | Phase 1 | Task 1.1 - 1.3 | Hoàn tất cấu hình số trang, class row-total và sig-section-wrapper | done | Sẵn sàng cho QA verify |
| 2026-06-26 12:54 | Phase 1 | Task 1.1 | Bắt đầu sửa đổi CSS @page trong generateLuongHtml | start | |
| 2026-06-26 | Phase 1 | Task 1.1 | Lập kế hoạch đồng bộ hóa Bảng tổng hợp lương | pending | |
