# Feature Tasks: Sửa Lỗi Tự Tính Lại Khi Xóa Và Tối Ưu Tốc Độ In Thuyết Minh L1/L2

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-06-25

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Sửa bug logic client-side L1/L2 và doPost L1

**Mục tiêu:** Khắc phục lỗi tự động tính toán lại khi xóa dữ liệu và sửa lỗi logic in doPost L1.

- [x] Task 1.1: Sửa [ThuyetMinhL1/client/pg_general_3.html](file:///d:/Project/UoTT/Dikhobac/ThuyetMinhL1/client/pg_general_3.html) để `functionInit` nhận thêm biến `isFirstLoad` kiểm soát tính lương tự động.
- [x] Task 1.2: Sửa [ThuyetMinhL2/client/pg_general_3.html](file:///d:/Project/UoTT/Dikhobac/ThuyetMinhL2/client/pg_general_3.html) tương tự.
- [x] Task 1.3: Cập nhật lệnh gọi `functionInit(false, false)` khi xóa thành công trong [ThuyetMinhL1/client/modal_dataluong_3.html](file:///d:/Project/UoTT/Dikhobac/ThuyetMinhL1/client/modal_dataluong_3.html) và [ThuyetMinhL2/client/modal_dataluong_3.html](file:///d:/Project/UoTT/Dikhobac/ThuyetMinhL2/client/modal_dataluong_3.html).
- [x] Task 1.4: Sửa logic phản hồi `action === 'print'` trong [ThuyetMinhL1/doPost/Code.js](file:///d:/Project/UoTT/Dikhobac/ThuyetMinhL1/doPost/Code.js) để xử lý mảng trả về chính xác thay vì chuỗi `"Success"`.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1: Test chức năng xóa và tính năng in phần 2 L1.

## Phase 2: Tối ưu hiệu năng in (server-side L1/L2) bằng Sheets API

**Mục tiêu:** Nâng tốc độ in bằng cách tối ưu hóa các lệnh đọc file Sheets lớn.

- [x] Task 2.1: Cập nhật hàm `doGet_getDataNhanSu_SoTaiKhoan()` trong [ThuyetMinhL1/doGet/doGet_function.js](file:///d:/Project/UoTT/Dikhobac/ThuyetMinhL1/doGet/doGet_function.js) dùng Sheets API, cấu hình `valueRenderOption: 'FORMATTED_VALUE'` cho text/tài khoản và `UNFORMATTED_VALUE` cho các giá trị số.
- [x] Task 2.2: Cập nhật hàm `doGet_getDataChotNSThang_WithBankInfo()` trong [ThuyetMinhL1/doGet/doGet_function.js](file:///d:/Project/UoTT/Dikhobac/ThuyetMinhL1/doGet/doGet_function.js) dùng Sheets API.
- [x] Task 2.3: Áp dụng tối ưu tương tự cho [ThuyetMinhL2/doGet/doGet_function.js](file:///d:/Project/UoTT/Dikhobac/ThuyetMinhL2/doGet/doGet_function.js).
- [x] Task 2.4: <!-- Sửa theo EFR-01 và EFR-03 --> Cập nhật hàm `doGet_buildDataPrint_DiNganHang()` L1 để đọc `DataLuong1` qua Sheets API (với dải ô/range hẹp và `valueRenderOption: 'UNFORMATTED_VALUE'`).
- [x] Task 2.5: <!-- Sửa theo EFR-02 --> Refactor luồng in L2 để không gọi trùng lặp hàm `doGet_getDataNhanSu_SoTaiKhoan()` hai lần trong cùng một request (truyền map đã load làm đối số hoặc gom nhóm).
- [x] Task 2.Final: 🧪 Test & Verify Phase 2: Đảm bảo dữ liệu in ra đúng định dạng và thời gian in dưới 10 giây cho toàn bộ L1 và L2.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-06-25 09:30 | Phase 1 | Task 1.1 | Bắt đầu code | start | Thiết lập cờ isFirstLoad trong functionInit L1 |
| 2026-06-25 09:33 | Phase 1 | Tasks 1.1-1.4 | Hoàn thành code | done | Đã hoàn thành sửa code client-side L1/L2 và doPost L1 |
| 2026-06-25 09:34 | Phase 1 | Task 1.Final | Bắt đầu kiểm thử | start | Chờ User kiểm tra chức năng xóa và in |
| 2026-06-25 09:35 | Phase 1 | Task 1.Final | Kiểm thử thành công | done | User xác nhận OK và đồng ý chuyển Phase |
| 2026-06-25 09:36 | Phase 2 | Task 2.1 | Bắt đầu code | start | Chuyển đổi doGet_getDataNhanSu_SoTaiKhoan L1 sang Sheets API |
| 2026-06-25 09:40 | Phase 2 | Tasks 2.1-2.5 | Hoàn thành code | done | Đã hoàn tất các tối ưu và tích hợp Sheets API |
| 2026-06-25 09:41 | Phase 2 | Task 2.Final | Bắt đầu kiểm thử | start | Chờ User kiểm thử hiệu năng in và định dạng dữ liệu |
| 2026-06-25 09:42 | Phase 2 | Task 2.Final | Kiểm thử thành công | done | User duyệt OK. Toàn bộ tính năng hoàn thành. |
