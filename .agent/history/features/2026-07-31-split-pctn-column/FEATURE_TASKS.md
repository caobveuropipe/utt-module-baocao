# Feature Tasks: Tách cột PCTN thành PC TN và PC TV

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-07-31

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Cập nhật cấu trúc dữ liệu và logic bóc tách phụ cấp

**Mục tiêu:** Bóc tách riêng hai thuộc tính `PCTN` (PC trách nhiệm) và `PCTV` (PC tự vệ) từ `DataLuong1` và `TruyThu1`.

- [x] Task 1.1: Thêm `PCTV: 0` vào `emptyMetric()` trong `doGet_hachToanLuongVaTruyLinh.js` ở cả hai định nghĩa (hàm test và hàm chạy chính).
- [x] Task 1.2: Cập nhật hàm `sumMetricRow()` để cộng cả `PCTV` vào `SumLPC` và `ThucLinh`.
- [x] Task 1.3: Cập nhật `addMetrics()` để cộng dồn trường `PCTV`.
- [x] Task 1.4: Cập nhật logic xử lý `DataLuong1` để gán `s.PCTN` bằng trách nhiệm allowance và `s.PCTV` bằng tự vệ allowance (thay vì gộp chung).
- [x] Task 1.5: Cập nhật logic xử lý `TruyThu1` để gán tương tự cho `s.PCTN` và `s.PCTV`.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1: Chạy cú pháp kiểm tra tĩnh hoặc debug logic bóc tách dữ liệu để đảm bảo không bị lỗi runtime.

## Phase 2: Cập nhật Giao diện hiển thị (Headers & Styles)

**Mục tiêu:** Cập nhật header và vẽ bảng tương thích với 22 cột trên Google Sheets.

- [x] Task 2.1: Cập nhật `header1` và `header2` trong `doGet_taoBangHachToanLuongVaTruyLinh` và `test_chiTietThanhPhanHachToanLuong` để thêm cột `PC TV`.
- [x] Task 2.2: Cập nhật mảng `merges` từ `["A5:A6", "B5:B6", "C5:E5", "F5:F6", "G5:K5", "L5:T5", "U5:U6"]` thành `["A5:A6", "B5:B6", "C5:E5", "F5:F6", "G5:L5", "M5:U5", "V5:V6"]`.
- [x] Task 2.3: Điều chỉnh các vòng lặp định dạng vẽ viền, set độ rộng cột (từ 21 lên 22 cột).
- [x] Task 2.4: Điều chỉnh hàm `getRow()` để trả về 22 phần tử tương ứng với 22 cột.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2: Tạo thành công bảng kê `THHachToanLuong` có 22 cột với đúng định dạng viền và màu nền.

## Phase 3: Kiểm thử toàn diện và đối chiếu kết quả

**Mục tiêu:** Xác nhận tính chính xác của dữ liệu và định dạng.

- [x] Task 3.1: Chạy `test_chiTietThanhPhanHachToanLuong('T06.2026', 'Hà Nội')` và đối chiếu dữ liệu với file Excel cũ.
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (Bắt buộc): Nhờ User xác nhận bảng hiển thị trực quan đúng như hình vẽ.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
