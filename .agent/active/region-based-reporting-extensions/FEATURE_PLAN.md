# Feature Plan - Extending Regional Reporting Extensions

Mở rộng logic lọc theo khu vực (Hà Nội, Phú Thọ, Tất cả) cho các báo cáo để đồng bộ với báo cáo bảo hiểm tháng. Bổ sung yêu cầu về hiển thị Tên ngân hàng trong báo cáo Chuyển khoản.

## 1. Mục tiêu và Phạm vi
- **Mục tiêu**: 
  - Cho phép người dùng chọn khu vực khi xuất 5 báo cáo: Tổng hợp lương, Hạch toán bảo hiểm, Hạch toán KPCĐ, Phân bổ tiền lương và BHXH, Hạch toán lương và truy lĩnh.
  - Tách và hiển thị "Tên ngân hàng" trong báo cáo "Tổng hợp chuyển khoản" (CK).
- **Phạm vi**:
  - Backend: Cập nhật các hàm xử lý trong thư mục `doGet/` để nhận tham số `location` và lọc dữ liệu. Cập nhật logic trích xuất Tên ngân hàng cho báo cáo CK.
  - Frontend: Cập nhật `client/pg_general_4.html` để hiển thị hộp thoại chọn địa phương khi người dùng nhấn nút xuất các báo cáo này.

## 2. Danh sách các báo cáo cần cập nhật
1.  **Tổng hợp lương**: `doGet/doGet_tongHopLuong.js` (Handler: `taoBangTongHopLuong`)
2.  **Hạch toán bảo hiểm**: `doGet/doGet_hachToanBaoHiem.js` (Handler: `taoBangHachToanBaoHiem`)
3.  **Hạch toán KPCĐ**: `doGet/doGet_hachToanKPCD.js` (Handler: `taoBangHachToanKPCD`)
4.  **Phân bổ tiền lương và BHXH**: `doGet/doGet_phanBoLuongBHXH.js` (Handler: `taoBangPhanBoLuongBHXH`)
5.  **Hạch toán lương và truy lĩnh**: `doGet/doGet_hachToanLuongVaTruyLinh.js` (Handler: `taoBangHachToanLuongVaTruyLinh`)
6.  **Tổng hợp chuyển khoản**: `doGet/doGet_tongHopCk.js` (Handler: `tongHopCk`) - *Thêm cột Tên ngân hàng chèn giữa Số tài khoản và Tổng ATM.*

## 3. Thiết kế Backend (doGet)

### 3.1. Cập nhật Router (`doGet/Code.js`)
- Đảm bảo tham số `location` được truyền vào tất cả các handler liên quan.

### 3.2. Cập nhật Logic Xử lý (`doGet/*.js`)
- Lọc nhân sự theo `locationNormalized` (sử dụng `normalizeLocation`).
- Đặc biệt cho `doGet_tongHopCk.js`:
  - Tách phần sau dấu `-` trong cột "Số tài khoản" của `DataNhanSu` để làm "Tên ngân hàng".
  - Chèn cột mới vào giữa cột D (Số tài khoản) và cột Tổng.

## 4. Thiết kế Frontend (client)

### 4.1. Cập nhật UI (`client/pg_general_4.html`)
- Hiển thị Swal chọn địa phương trước khi gọi API xuất báo cáo.

## 5. Kế hoạch thực hiện

### Phase 1: Cập nhật Backend (Lọc khu vực)
- Cập nhật 5 báo cáo (Lương, BH, KPCD, Phân bổ, Hạch toán lương).

### Phase 2: Cập nhật Báo cáo Chuyển khoản (Xử lý Ngân hàng)
- Task 2.1: Cập nhật `doGet_tongHopDiNganHang` để tách Tên ngân hàng.
- Task 2.2: Cập nhật `doGet_taoBangTongHopCk` để chèn cột E (Tên ngân hàng).

### Phase 3: Cập nhật Frontend
- Task 3.1: Thêm Popup chọn địa phương cho các báo cáo còn thiếu.

### Phase 4: Kiểm thử
- Kiểm tra hiển thị cột mới trong Excel CK.
- Kiểm tra lọc khu vực cho tất cả báo cáo.

## 6. Rủi ro và Giải pháp
- **Rủi ro**: "Số tài khoản" không chứa dấu `-`. 
- **Giải pháp**: Nếu không có dấu `-`, Tên ngân hàng sẽ để trống, tránh gây lỗi trích xuất.
