# Feature Tasks: Cải thiện hiển thị màn hình HTML Bảng phân bổ tiền lương và BHXH

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-08-18 (Cập nhật theo yêu cầu User)

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối phase bắt buộc có `Task 1.Final: 🧪 Test & Verify Phase 1`

## Phase 1: Tinh chỉnh kích thước tối thiểu & Chống vỡ chữ trên màn hình HTML (Giữ nguyên bản in)

**Mục tiêu:** Các cột trên màn hình HTML hiển thị đầy đủ, có kích thước tối thiểu rõ ràng, không bị wrap chữ từng ký tự; giữ nguyên toàn bộ cấu hình `@media print`.

- [x] Task 1.1: Cấu hình `min-width` tổng thể cho `.phanbo-table` trên màn hình (~1350px) và tối ưu độ rộng `colgroup` cho 23 cột (Nội dung >= 160px, các cột hệ số >= 40-48px, các cột tiền >= 65-85px) trong `generateGenericReportHtml` (`client/pg_general_3.html`).
- [x] Task 1.2: Thiết lập quy tắc CSS chống vỡ chữ: `word-break: normal; white-space: normal;` cho các tiêu đề/nội dung chữ và `white-space: nowrap;` cho ô số liệu để không bị ngắt chữ đơn lẻ.
- [x] Task 1.3: Đảm bảo `.page-container` hỗ trợ `overflow-x: auto;` khi xem trên màn hình và giữ nguyên 100% block `@media print` không bị thay đổi.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc): Mở màn hình HTML xem bảng phân bổ, xác nhận các cột hiển thị ngang ngay ngắn, rõ ràng, và xác nhận bản in (`Ctrl + P`) giữ nguyên định dạng in ban đầu.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-08-18 15:46 | Khởi tạo | Plan & Tasks | Cập nhật plan theo feedback: chỉ chỉnh màn hình HTML, giữ nguyên bản in | done | Chờ duyệt thực thi |
| 2026-08-18 15:49 | Phase 1 | Task 1.1 | Cập nhật cấu trúc header HTML 3 hàng và colgroup 23 cột | done | Sửa header merging & colgroup |
| 2026-08-18 15:50 | Phase 1 | Task 1.2, 1.3 | Cập nhật CSS table-layout fixed, min-width 1410px và reset media print | done | Hoàn thành code |
| 2026-08-18 15:51 | Phase 1 | Task 1.Final | AI self-test code logic, chuẩn bị handoff User test | done | Đã verify logic |
| 2026-08-18 17:03 | Phase 1 | Task 1.Final | User test trên môi trường thực tế và xác nhận OK | done | Hoàn thành feature |
