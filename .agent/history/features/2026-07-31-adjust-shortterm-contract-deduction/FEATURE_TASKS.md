# Feature Tasks: Điều chỉnh trừ lương và truy lĩnh HĐ ngắn hạn

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-07-31

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Triển khai logic tính toán & Cập nhật giao diện báo cáo

**Mục tiêu:** Thêm dòng "Tổng truy lĩnh HĐ N.hạn-TT" và cập nhật các công thức trừ cho cả báo cáo chính và sheet audit.

- [x] Task 1.1: Cập nhật hàm `doGet_processHachToanLuongVaTruyLinh` trong [doGet_hachToanLuongVaTruyLinh.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_hachToanLuongVaTruyLinh.js):
  - Khai báo và tính toán `nhTt` (tổng của HĐ ngắn hạn Trực tiếp) tương tự như `nhGt`.
  - Sửa đổi công thức `sumTotalGT` để trừ đi `nhGt`.
  - Sửa đổi công thức `sumTotalTT` để trừ đi `nhTt`.
  - Chèn dòng `Tổng truy lĩnh HĐ N.hạn-TT` vào `table` bằng `table.push(getRow("Tổng truy lĩnh HĐ N.hạn-TT", nhTt))` ngay dưới dòng `Tổng truy lĩnh HĐ N.hạn-GT`.
  - Cập nhật công thức tính `totalA` để cộng dồn đúng các thành phần: `addMetrics(totalA, sumTotalGT); addMetrics(totalA, sumTotalTT); addMetrics(totalA, nhGt); addMetrics(totalA, nhTt);`. (Cần cộng lại `nhGt` và `nhTt` vì `sumTotalGT` và `sumTotalTT` đã bị trừ đi 2 khoản này).
- [x] Task 1.2: Cập nhật hàm audit `test_chiTietThanhPhanHachToanLuong` trong [doGet_hachToanLuongVaTruyLinh.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_hachToanLuongVaTruyLinh.js):
  - Áp dụng các thay đổi logic tương tự như trên đối với `resultTable` và `totalA`.
- [x] Task 1.3: Cập nhật điều kiện tô màu và định dạng dòng trong hàm `doGet_taoBangHachToanLuongVaTruyLinh` và `test_chiTietThanhPhanHachToanLuong` để dòng mới chèn có viền (border) và màu nền/style đúng chuẩn.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc)
  - Chạy hàm `test_doGet_taoBangHachToanLuongVaTruyLinh()` và `test_chiTietThanhPhanHachToanLuong()` bằng cách chạy test script/gọi qua console để kiểm tra file xuất ra.
  - So sánh và xác nhận số liệu thực lĩnh, thuế TNCN và các cột khác chính xác.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-07-31 15:20 | Phase 1 | Khởi tạo | Tạo FEATURE_PLAN.md và FEATURE_TASKS.md | done | |
| 2026-07-31 15:25 | Phase 1 | Task 1.1 - 1.3 | Cập nhật logic code và định dạng trong file doGet_hachToanLuongVaTruyLinh.js | done | |
| 2026-07-31 15:30 | Phase 1 | Task 1.Final | Test và xác thực kết quả hiển thị | done | |
