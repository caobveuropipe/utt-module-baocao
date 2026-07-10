# Feature Tasks: Loại bỏ đường gridline mặc định khi xuất Excel

> **Trạng thái**: 🔄 Đang thực hiện
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-07-03

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Thêm logic ẩn gridlines vào các hàm xuất bảng tổng hợp

**Mục tiêu:** Thêm lệnh `sheet.setHideGridlines(true)` vào các vị trí chính xác để ẩn gridlines mặc định của Excel khi xuất file.

- [x] Task 1.1: Cập nhật `doGet_tongHopCk.js` (hàm `doGet_taoBangTongHopCk`)
<!-- Sửa theo EFR-02: loại bỏ doGet_taoBangTongHopLuongChiTiet không tồn tại -->
- [x] Task 1.2: Cập nhật `doGet_tongHopLuong.js` (hàm `doGet_taoBangTongHopLuong`)
<!-- Sửa theo EFR-01: đổi tên hàm bảo hiểm thành doGet_taoBangTongHopBaoHiem -->
- [x] Task 1.3: Cập nhật `doGet_tongHopBaoHiem.js` (hàm `doGet_taoBangTongHopBaoHiem`)
- [x] Task 1.4: Cập nhật `doGet_tongHopKPCD.js` (hàm `doGet_taoBangTongHopKPCD`)
- [x] Task 1.5: Cập nhật `doGet_tongHopKhoanTru.js` (hàm `doGet_taoBangTongHopKhoanTru`)
- [/] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc)

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-07-03 10:56 | Phase 1 | Task 1.1 | Bắt đầu cập nhật `doGet_tongHopCk.js` | start | |
| 2026-07-03 10:57 | Phase 1 | Task 1.1 | Hoàn thành thêm ẩn gridlines cho `doGet_tongHopCk.js` | done | |
| 2026-07-03 10:57 | Phase 1 | Task 1.2 | Bắt đầu cập nhật `doGet_tongHopLuong.js` | start | |
| 2026-07-03 10:58 | Phase 1 | Task 1.2 | Hoàn thành thêm ẩn gridlines cho `doGet_tongHopLuong.js` | done | |
| 2026-07-03 10:58 | Phase 1 | Task 1.3 | Bắt đầu cập nhật `doGet_tongHopBaoHiem.js` | start | |
| 2026-07-03 10:59 | Phase 1 | Task 1.3 | Hoàn thành thêm ẩn gridlines cho `doGet_tongHopBaoHiem.js` | done | |
| 2026-07-03 10:59 | Phase 1 | Task 1.4 | Bắt đầu cập nhật `doGet_tongHopKPCD.js` | start | |
| 2026-07-03 11:00 | Phase 1 | Task 1.4 | Hoàn thành thêm ẩn gridlines cho `doGet_tongHopKPCD.js` | done | |
| 2026-07-03 11:00 | Phase 1 | Task 1.5 | Bắt đầu cập nhật `doGet_tongHopKhoanTru.js` | start | |
| 2026-07-03 11:01 | Phase 1 | Task 1.5 | Hoàn thành thêm ẩn gridlines cho `doGet_tongHopKhoanTru.js` | done | |
| 2026-07-03 11:01 | Phase 1 | Task 1.Final | Thực hiện tự kiểm tra mã nguồn | start | |
| 2026-07-03 11:02 | Phase 1 | Task 1.Final | Phát hiện lỗi: sheet.setHideGridlines is not a function | retry | Phương thức đúng là `setHiddenGridlines(true)` |
| 2026-07-03 11:03 | Phase 1 | Task 1.Final | Đã sửa đổi code sang `setHiddenGridlines(true)` và chờ User push | start | |
| 2026-07-03 11:05 | Phase 1 | Task 1.Final | Thêm lệnh `SpreadsheetApp.flush()` ở cả 5 báo cáo tổng hợp để ép lưu thay đổi gridline trước khi export | start | |
| 2026-07-03 11:10 | Phase 1 | Task 1.Final | Phát hiện Excel vẫn tự động bật "Print Gridlines" do cơ chế export của Google Sheets. Đổi phương án sang tô màu nền trắng (#ffffff) toàn bộ sheet để triệt tiêu gridlines trong Excel | start | |
| 2026-07-03 11:18 | Phase 1 | Task 1.Final | Thu hẹp vùng tô màu nền trắng chỉ nằm trong phạm vi vùng dữ liệu thực tế (data range) để tránh làm phình to vùng in của Excel | start | |
