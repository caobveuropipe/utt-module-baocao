# Feature Tasks: Sửa lỗi hiển thị header Bảng phân bổ tiền lương và BHXH

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-07-17

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Chuẩn hóa header dòng 6 và 7

**Mục tiêu:** Định vị lại cấu trúc merge của dòng 6 tiêu đề nhóm để không bị merge tràn sang cột 18.

- [x] Task 1.1: Hủy merge vùng dòng 6 và 7 (A6:V7) để xóa trạng thái merge cũ của template. <!-- Sửa theo EFR-02 -->
- [x] Task 1.2: Merge các nhóm cột đúng chuẩn: <!-- Sửa theo EFR-02 -->
  - C6:I6 -> "Hệ số"
  - K6:N6 -> "Các khoản phải nộp theo lương"
  - O6:P6 -> "Các khoản giảm trừ"
  - Q6:R6 -> "Trừ khác"
- [x] Task 1.Final: 🧪 Test & Verify Phase 1

## Phase 2: Sắp xếp số thứ tự, công thức và dòng dữ liệu

**Mục tiêu:** Tách biệt dòng số thứ tự (dòng 8), dòng công thức (dòng 9), và đưa dòng bắt đầu ghi dữ liệu xuống dòng 10.

- [x] Task 2.1: Sửa logic ghi số thứ tự cột 1-21 vào dòng 8, định dạng dạng text `@`. <!-- Sửa theo EFR-01 -->
- [x] Task 2.2: Sửa logic ghi công thức vào dòng 9. <!-- Sửa theo EFR-01 -->
- [x] Task 2.3: Thay đổi dòng ghi dữ liệu bắt đầu từ dòng 10 (thay vì dòng 11). <!-- Sửa theo EFR-01 -->
- [x] Task 2.4: Điều chỉnh dải định dạng số hệ số (`0.000`) và số tiền (`#,##0`) dịch chuyển tương ứng xuống từ dòng 10.
- [x] Task 2.5: Cập nhật nét kẻ viền (Borders) cho 4 dòng header (6-9) và dải dữ liệu.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-07-17 15:20 | Phase 1 | Task 1.1 | Bắt đầu hủy merge dòng 7 | start | |
| 2026-07-17 15:23 | Phase 1 | Task 1.2 | Hoàn thành hủy merge và re-merge dòng 7 | done | |
| 2026-07-17 15:24 | Phase 2 | Tasks 2.1-2.5 | Hoàn thành tách biệt các dòng header và điều chỉnh data start | done | |
| 2026-07-17 15:27 | Phase 1-2 | Tái cấu trúc | Sắp xếp lại dải dòng bắt đầu từ dòng 6 thay vì dòng 7 | done | Fix lại chỉ số theo đúng thực tế xuất bản |
| 2026-07-17 15:58 | Phase 1-2 | Final | User đã kiểm tra và xác nhận hiển thị hoàn hảo | done | Hoàn thành feature |
