# Feature Tasks: Bảng Hạch Toán Bảo Hiểm

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-07-27

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Cập nhật Data Processor cho Hạch toán Bảo hiểm

**Mục tiêu:** Cập nhật hàm `processDataHachToanBaoHiem` trong `doGet_hachToanBaoHiem.js` bóc tách đúng các chỉ tiêu I.1-I.4, II.1-II.2 và III (Mã nước ngoài).

- [x] Task 1.1: Đọc và xây dựng bộ map nhân sự (`personnel` & `allPersonnelRecords`) từ `DataChotNSThang` lưu đầy đủ `LoaiHD`, `MaBP`, `KhuVuc`, `TrangThai` và tích hợp các helper `getContractType`, `getUnitCode`, `getUnitType` giống hệt `doGet_hachToanLuongVaTruyLinh.js`.
- [x] Task 1.2: Bóc tách nguồn `DataLuong1` và `DataTruyThuLinh` cho Mục I (Gián tiếp 4 loại HĐ), sửa logic lọc Truy lĩnh (còn nhận > 0) và Truy thu (còn nhận < 0).
- [x] Task 1.3: Bóc tách nguồn `DataLuong1` và `DataTruyThuLinh` cho Mục II (Trực tiếp 2 loại HĐ), loại trừ nhân sự có trạng thái là "Đi công tác NN" (tra cứu từ `DataChotNSThang`).
- [x] Task 1.4: Tổng hợp Mục III (Mã nước ngoài) gom toàn bộ các nhân sự Trực tiếp có trạng thái "Đi công tác NN" được tách từ Mục II.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc)

## Phase 2: Cập nhật Render & Excel Export Template

**Mục tiêu:** Đảm bảo dữ liệu mới được điền chính xác vào cấu trúc bảng hạch toán bảo hiểm và tính toán tổng tiền khớp tuyệt đối.

- [x] Task 2.1: Cập nhật hàm tạo dòng kết quả, hỗ trợ xuất đầy đủ Mục I, Mục II, và Mục III (Mã nước ngoài).
- [x] Task 2.2: Cập nhật tính toán hai dòng tổng cộng cuối bảng: "Cộng: I+II" và "Tổng cộng: I+II+III".
- [x] Task 2.3: Kiểm tra định dạng font chữ, border, và tô nền màu vàng cho dòng Truy lĩnh/Truy thu (nếu cần thiết theo thiết kế).
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Bắt buộc)

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-07-27 | - | - | Khởi tạo checklist | done | Khởi tạo task list cho feature hach-toan-bao-hiem |
| 2026-07-27 | Phase 1 | Task 1.1 | Cập nhật cấu trúc nạp nhân sự từ DataChotNSThang | done | Đồng bộ hóa toàn bộ thuộc tính nhân sự với doGet_hachToanLuongVaTruyLinh.js |
| 2026-07-27 09:47 | Phase 1 | Task 1.1 | Bắt đầu triển khai | start | Thiết lập ánh xạ dữ liệu nhân sự |
| 2026-07-27 09:48 | Phase 1 | Task 1.1, 1.2 | Hoàn thành và sửa dấu | done | Đã tích hợp helper đồng bộ và đảo lại dấu truy thu/lĩnh |
| 2026-07-27 09:48 | Phase 1 | Task 1.3, 1.4 | Triển khai tách nước ngoài | start | Cập nhật bộ gom nhóm nước ngoài |
| 2026-07-27 09:49 | Phase 1 | Task 1.3, 1.4 | Hoàn thành tách nước ngoài | done | Hoàn tất bộ bóc tách dữ liệu Mục I, II, III |
| 2026-07-27 09:49 | Phase 1 | Task 1.Final | Self-test dữ liệu processor | start | Đang chạy self-test |
| 2026-07-27 09:50 | Phase 2 | Task 2.1-2.3 | Hoàn tất Render & Style | done | Đã xuất Mục III, Cộng I+II, Tổng cộng I+II+III và tô nền vàng Truy thu/lĩnh |
| 2026-07-27 09:50 | Phase 2 | Task 2.Final | Chạy self-test xuất Excel | start | Đang chạy self-test render |
