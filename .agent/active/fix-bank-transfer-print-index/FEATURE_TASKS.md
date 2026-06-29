# Feature Tasks: Khắc phục lệch số liệu Bảng đi ngân hàng L1 và Bảng tổng hợp lương

> **Trạng thái**: ⏳ Chưa bắt đầu
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-05-21

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

---

## Phase 1: Chỉnh sửa Backend ThuyetMinhL1 & Deploy Kiểm thử

**Mục tiêu:** Loại bỏ lỗi khấu trừ trùng lặp Đoàn phí ở backend L1, đảm bảo số liệu trả về khớp hoàn toàn với thực lĩnh chốt và khớp Bảng tổng hợp lương.

- [ ] Task 1.1: Sửa logic trong `ThuyetMinhL1/doGet/doGet_function.js` tại hàm `doGet_getDataPrint_KhongThayDoi`:
  - Định nghĩa lại `tongPC_KBNN = pcNganh + pcDocHai + pcTrachNhiem` (không cộng `dDoan`).
  - Sử dụng `tongPC_KBNN` để tính `luongPC` và `tienCongLD`.
  - Cập nhật cột 4 trong mảng trả về thành `soTien` (thực lĩnh nét gốc).
- [ ] Task 1.2: Thực hiện `clasp push` hoặc deploy cho module ThuyetMinhL1 lên Apps Script Cloud.
- [ ] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc)
  - Mở Web App và in thử Bảng đi ngân hàng L1 (In tất cả / In theo khu vực).
  - Đối chiếu dòng "Tổng cộng" của cột "Tổng số" với dòng "I. TIỀN LƯƠNG" trên Bảng tổng hợp lương.
  - Xác thực tổng các cột chi tiết trên bản in (5 + 6 + 7 + 8 + 9) khớp chính xác 100% với cột 4.
  - Đảm bảo Module L2 và các file HTML khác hoạt động bình thường, không bị ảnh hưởng.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-05-21 10:35 | Phase 1 | Task 1.1 | Cập nhật lại kế hoạch mới tập trung sửa đổi Backend L1, khôi phục các chỉnh sửa L2 | done | Đang chờ người dùng duyệt plan mới |
