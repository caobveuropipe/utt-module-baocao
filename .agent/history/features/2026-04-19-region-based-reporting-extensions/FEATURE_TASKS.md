# Feature Tasks - Regional Reporting Extensions & Bank Name Column

## PHÁC THẢO TIẾN ĐỘ
- [x] Phase 1: Backend Implementation (Regional Filtering)
- [x] Phase 2: Bank Name Column for CK Report
- [x] Phase 3: Frontend Implementation (Swal Popups)
- [ ] Phase 4: Validation & Testing

## CHI TIẾT CÁC TÁC VỤ

### Phase 1: Backend Implementation (Regional Filtering)
- [x] **Task 1.1: Update routing in `doGet/Code.js`**
- [x] **Task 1.2: Update `doGet/doGet_tongHopLuong.js`**
- [x] **Task 1.3: Update `doGet/doGet_hachToanBaoHiem.js`**
- [x] **Task 1.4: Update `doGet/doGet_hachToanKPCD.js`**
- [x] **Task 1.5: Update `doGet/doGet_phanBoLuongBHXH.js`**
- [x] **Task 1.6: Update `doGet/doGet_hachToanLuongVaTruyLinh.js`**

### Phase 2: Bank Name Column for CK Report
- [x] **Task 2.1: Update `doGet_tongHopDiNganHang` in `doGet_tongHopCk.js`**
  - [x] Tách `tenNH` từ chuỗi `soTKFull` (split by '-').
  - [x] Chèn `tenNH` vào mảng output tại index 4.
- [x] **Task 2.2: Update `doGet_taoBangTongHopCk` in `doGet_tongHopCk.js`**
  - [x] Cập nhật header: Chèn 'Tên ngân hàng' vào sau 'Số tài khoản'.
  - [x] Điều chỉnh logic tính `totals`: Bắt đầu từ index 5.
  - [x] Cập nhật `sheet.setColumnWidth` và định dạng ô (border, alignment) cho cột mới.

### Phase 3: Frontend Implementation
- [x] **Task 3.1: Update `client/pg_general_4.html`**
  - [x] Chèn Swal popup chọn địa phương cho 5 báo cáo.

### Phase 4: Validation & Testing
- [ ] **Task 4.1: Verify CK Report structure**
  - [ ] Xuất thử báo cáo CK và kiểm tra cột E có phải là "Tên ngân hàng" không.
- [ ] **Task 4.2: Verify Regional Filtering across all reports**

## Execution Log
- [x] Phase 1, 2 & 3 completed.
- [ ] Ready for Phase 4: Validation & Testing.
