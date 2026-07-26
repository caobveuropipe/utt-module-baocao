# Feature Plan: Test Chi Tiết Thành Phần Bảng Kê Hạch Toán Lương Và Truy Lĩnh LƯơng

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Đã thông qua feature-review. Đủ điều kiện triển khai bằng `feature-coordinator`.
> **Feature slug**: test-hach-toan-luong-detail
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-07-21

---

## Review Notes
- **Review Date**: 2026-07-21
- **Verdict**: ✅ ĐỒNG Ý
- **Ghi chú**: Plan đạt tiêu chuẩn, không gây ảnh hưởng đến logic production. Khuyến nghị hàm test ngoài việc `Logger.log` cần `return` thêm Javascript Object chi tiết để tiện debug.

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Bảng kê hạch toán lương và truy lĩnh lương (`doGet_taoBangHachToanLuongVaTruyLinh` / `doGet_processHachToanLuongVaTruyLinh`) tổng hợp dữ liệu từ nhiều nguồn Google Sheets khác nhau (`DataLuong1`, `DataLuong2`, `TruyThuLuong1`, `TruyThuLuong2`, `DataAnCa`, `DataChotNSThang`, `Setup`). Hiện tại chưa có function test độc lập để soi từng chi tiết thành phần (dữ liệu thô, map đơn vị/hợp đồng, dữ liệu sau tính toán từng phần) cho một tháng và địa phương cụ thể.
- **Vấn đề cần giải quyết:** Thiếu công cụ/hàm test để kiểm tra chi tiết từng bước tính toán, đối chiếu giá trị ghép nối và bóc tách dữ liệu hạch toán cho tham số cụ thể `T06.2026` và địa phương `Hà Nội`.
- **Mục tiêu:** Tạo hàm test chuyên biệt (ví dụ: `test_chiTietThanhPhanHachToanLuong(monthStr, location)`) trong module `doGet` để log và xuất chi tiết từng thành phần cấu thành nên Bảng kê hạch toán lương.
- **Kết quả mong đợi:** Hàm test chạy thành công, xuất ra console log / struct dữ liệu chi tiết từng phần (Setup map, Personnel map, DataLuong1 breakdown, TruyThu breakdown, DataLuong2, DataAnCa, và Bảng tổng hợp cuối) với tham số mặc định `T06.2026` và `Hà Nội`.

## 2. Phạm vi

### In scope
- Tạo hàm `test_chiTietThanhPhanHachToanLuong(monthStr, location)` trong `doGet/doGet_hachToanLuongVaTruyLinh.js`.
- Bổ sung helper / inspection logger giúp bóc tách và in chi tiết:
  1. Unit -> Group (Gián tiếp / Trực tiếp) mapping từ `Setup`.
  2. Nhân sự & Hợp đồng (Biên chế, HĐ dài hạn, HĐ 68, HĐ ngắn hạn, ...) lọc theo kỳ `T06.2026` và khu vực `Hà Nội` từ `DataChotNSThang`.
  3. Chi tiết tổng hợp từng nguồn: `DataLuong1`, `TruyThu1`, `DataLuong2`, `TruyThu2`, `DataAnCa`.
  4. Chi tiết từng mục dòng trong Bảng kê hạch toán (Mục I, II, A, B, C, D, Tổng cộng).
- Mặc định tham số test là `monthStr = 'T06.2026'` và `location = 'Hà Nội'`.
- **Tạo 1 sheet phụ có tên `Audit_HachToanLuong` trong file Spreadsheet xuất (`EXPORT_HT_TH_LUONG_VA_TTTL`) chứa toàn bộ log audit chi tiết để User trực tiếp xem và đối soát dữ liệu trên bảng tính.**

### Out of scope
- Thay đổi logic tính toán cốt lõi của `doGet_processHachToanLuongVaTruyLinh` trừ khi phát hiện bug trong quá trình review.
- Chỉnh sửa giao diện HTML client (`client/pg_general_3.html`).

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** 
  - Tuân thủ quy định tối ưu truy vấn dữ liệu từ `DataChotNSThang` và các file data bằng Sheets API / helper chuẩn.
  - Sử dụng hàm `normalizeLocation` trong `doGet_function.js` để lọc chính xác địa phương `Hà Nội`.
- **"Cấm kỵ" cần tránh:** 
  - Không sửa trực tiếp làm thay đổi cấu trúc bảng kết quả xuất Excel/PDF đang chạy của production.
  - Không ghi cứng dữ liệu giả lập nếu dữ liệu thật có sẵn trong Sheet.
- **Ràng buộc kiến trúc liên quan:** 
  - Đặt hàm test tại module `doGet/doGet_hachToanLuongVaTruyLinh.js`.

## 4. Giả định và câu hỏi mở

### Giả định
- Dữ liệu tháng `T06.2026` và địa phương `Hà Nội` có tồn tại hoặc hàm test sẽ thông báo rõ ràng số lượng dòng match nếu dữ liệu trống.
- Hàm test phục vụ cho việc kiểm tra log trên Google Apps Script Execution log hoặc return object JSON chi tiết.

### Câu hỏi mở
- *Đã xác nhận:* Tạo một audit sheet có tên `Audit_HachToanLuong` trong file Spreadsheet xuất (`EXPORT_HT_TH_LUONG_VA_TTTL`) để audit.

## 5. Acceptance Criteria

- [ ] Hàm `test_chiTietThanhPhanHachToanLuong(monthStr, location)` được tạo trong `doGet/doGet_hachToanLuongVaTruyLinh.js`.
- [ ] Chạy hàm test với `monthStr = 'T06.2026'` và `location = 'Hà Nội'` không phát sinh lỗi runtime.
- [ ] Output log hiển thị chi tiết số lượng bản ghi match, tổng số tiền từng cột theo từng thành phần (A.I, A.II, B, C, D).
- [ ] **Hàm test tự tạo/overwrite sheet `Audit_HachToanLuong` trong file Spreadsheet `EXPORT_HT_TH_LUONG_VA_TTTL` và ghi toàn bộ dữ liệu audit thô/intermediate tính toán vào đó để kiểm tra.**

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| [doGet_hachToanLuongVaTruyLinh.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_hachToanLuongVaTruyLinh.js) | Sửa (Thêm function test) | Thêm hàm `test_chiTietThanhPhanHachToanLuong` và export/logger chi tiết | 🟢 Thấp | Có |

## 7. Risk Triage và Review Focus

- **Review required:** Yes (Khuyến nghị gọi `feature-review`)
- **Risk hotspots:** Đảm bảo hàm test không làm ảnh hưởng đến hàm `doGet_taoBangHachToanLuongVaTruyLinh` hiện tại.
- **Review focus areas:** Kiểm tra tính chính xác của các chỉ số tổng hợp bóc tách từ `storage` key (`g|t|ut|sub|ct`).
- **Known pitfalls / historical issues:** Chú ý việc chuẩn hóa chuỗi tháng ('T06.2026' vs '06.2026') và chuẩn hóa địa phương ('Hà Nội' vs 'hà nội').

## 8. Chiến lược triển khai

- **Phase strategy:** 
  - Phase 1: Tạo hàm test `test_chiTietThanhPhanHachToanLuong` với log chi tiết các thành phần đầu vào và kết quả trung gian.
  - Phase 2: Chạy kiểm thử hàm test với tham số `T06.2026` và `Hà Nội`.
- **Thứ tự triển khai:** Viết hàm test -> Chạy test -> Xác nhận log/kết quả.

## 9. Test Strategy

- **Automated tests:** Chạy hàm `test_chiTietThanhPhanHachToanLuong('T06.2026', 'Hà Nội')` từ Apps Script IDE hoặc runner.
- **Manual verification:** Kiểm tra log kết quả đối chiếu số liệu tổng cộng hợp lệ.

## 10. Rollback Plan

- Nếu có sự cố, xoá hàm test vừa thêm trong [doGet_hachToanLuongVaTruyLinh.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_hachToanLuongVaTruyLinh.js).

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
