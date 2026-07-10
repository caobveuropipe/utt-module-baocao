# Feature Plan: Loại bỏ đường gridline mặc định khi xuất Excel

> **Trạng thái**: ⏳ CHỜ REVIEW
> **Review gate**: [User bỏ qua review với rủi ro đã nêu]
> **Feature slug**: remove-excel-gridlines
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-07-03

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Khi người dùng xuất các báo cáo tổng hợp (Tổng hợp chuyển khoản, Tổng hợp lương, Tổng hợp bảo hiểm, Tổng hợp KPCD, Tổng hợp khoản trừ) ra Excel và tiến hành in, các đường gridline mặc định của Excel vẫn hiển thị làm xấu và đè lên phần kẻ viền (border) tuỳ chỉnh của báo cáo.
- **Vấn đề cần giải quyết:** Tắt hiển thị gridlines mặc định của sheet trong file Google Sheets trước khi export sang file xlsx.
- **Mục tiêu:** File Excel khi xuất ra không có các đường kẻ ô mặc định của Excel lúc xem cũng như lúc in, chỉ hiện các đường kẻ border do mã nguồn thiết lập.
- **Kết quả mong đợi:** Tất cả các bảng tổng hợp xuất ra Excel đều được thiết lập ẩn gridlines (`sheet.setHideGridlines(true)`).

## 2. Phạm vi

### In scope
<!-- Sửa theo EFR-01: đổi tên hàm bảo hiểm thành doGet_taoBangTongHopBaoHiem -->
<!-- Sửa theo EFR-02: loại bỏ doGet_taoBangTongHopLuongChiTiet không tồn tại -->
- Cập nhật các hàm xuất file bảng tổng hợp trong các file doGet sau để thêm `sheet.setHideGridlines(true)`:
  - `doGet_tongHopCk.js` (hàm `doGet_taoBangTongHopCk`)
  - `doGet_tongHopLuong.js` (hàm `doGet_taoBangTongHopLuong`)
  - `doGet_tongHopBaoHiem.js` (hàm `doGet_taoBangTongHopBaoHiem`)
  - `doGet_tongHopKPCD.js` (hàm `doGet_taoBangTongHopKPCD`)
  - `doGet_tongHopKhoanTru.js` (hàm `doGet_taoBangTongHopKhoanTru`)

### Out of scope
- Cấu hình trang in hay thay đổi kích thước cột, font chữ của các bảng báo cáo (giữ nguyên định dạng cũ).

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** Giữ nguyên các thao tác ghi dữ liệu, căn lề và định dạng border (SOLID/DOTTED) hiện có trong mã nguồn.
- **"Cấm kỵ" cần tránh:** Không thay đổi cấu trúc dữ liệu hoặc các logic tính toán số tiền, tổng cộng của các bảng.

## 4. Giả định và câu hỏi mở

### Giả định
- Phương thức `sheet.setHideGridlines(true)` là đủ để vô hiệu hóa gridlines trong cả hiển thị online và tệp Excel được export tải xuống.

### Câu hỏi mở
- Không có.

## 5. Acceptance Criteria

- [ ] Cả 5 file doGet liên quan đến bảng tổng hợp đều có thiết lập `sheet.setHideGridlines(true)` trên sheet đích.
- [ ] File xuất ra Excel không còn hiển thị gridlines của Excel khi mở lên và in ấn.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `doGet/doGet_tongHopCk.js` | Sửa | Thêm `sheet.setHideGridlines(true)` | 🟢 Cực thấp | Có |
| `doGet/doGet_tongHopLuong.js` | Sửa | Thêm `sheet.setHideGridlines(true)` | 🟢 Cực thấp | Có |
| `doGet/doGet_tongHopBaoHiem.js` | Sửa | Thêm `sheet.setHideGridlines(true)` | 🟢 Cực thấp | Có |
| `doGet/doGet_tongHopKPCD.js` | Sửa | Thêm `sheet.setHideGridlines(true)` | 🟢 Cực thấp | Có |
| `doGet/doGet_tongHopKhoanTru.js` | Sửa | Thêm `sheet.setHideGridlines(true)` | 🟢 Cực thấp | Có |

## 7. Risk Triage và Review Focus

- **Review required:** No (Thay đổi cực kỳ nhỏ, chỉ thêm 1 dòng code hiển thị ở mỗi file)
- **Risk hotspots:** Không có
- **Review focus areas:** Đảm bảo `sheet` được lấy/khởi tạo chính xác trước khi gọi `setHideGridlines(true)`.
- **Known pitfalls / historical issues:** Tránh nhầm lẫn gọi phương thức trên đối tượng `Spreadsheet` (phương thức này thuộc đối tượng `Sheet`).
- **Dependencies / rollout concerns:** Cần deploy lên Apps Script thông qua `push-all.ps1` sau khi hoàn thành.

## 8. Chiến lược triển khai

- **Phase strategy:** Triển khai sửa đổi mã nguồn trên cả 5 file trong 1 phase duy nhất do tính chất thay đổi đơn giản và tương đồng.
- **Thứ tự triển khai:**
  1. Thêm code ẩn gridline vào `doGet_tongHopCk.js`
  2. Thêm code ẩn gridline vào `doGet_tongHopLuong.js`
  3. Thêm code ẩn gridline vào `doGet_tongHopBaoHiem.js`
  4. Thêm code ẩn gridline vào `doGet_tongHopKPCD.js`
  5. Thêm code ẩn gridline vào `doGet_tongHopKhoanTru.js`
- **Yêu cầu migration / config / deploy:** Chạy `push-all.ps1` để đồng bộ code lên Apps Script.

## 9. Test Strategy

- **Manual verification:**
  - Chạy thử các hàm test tạo báo cáo (nếu có sẵn) hoặc yêu cầu deploy và tải các bảng tổng hợp Excel kiểm tra hiển thị.

## 10. Rollback Plan

- Khôi phục file code qua Git / Clasp state cũ nếu có lỗi biên dịch.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
