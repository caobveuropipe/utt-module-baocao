# Test Cases: Tối Ưu Tốc Độ Load Trang & Khởi Tạo Giao Diện

> **Mã tính năng:** `toi-uu-toc-do-load-trang`  
> **Ngày lập:** 2026-08-22  
> **Phạm vi kiểm thử:** Server-Side Data Injection (SSR), CacheService phân quyền, Centralized Auth Gate Core API, Nút làm mới danh sách tháng.

---

## 1. Happy Path Test Cases (Luồng chuẩn)

### TC-01: Mở trang Web App với tài khoản hợp lệ (SSR Instant Load)
- **Mục tiêu:** Kiểm tra giao diện khởi tạo sẵn sàng ngay lập tức.
- **Tiền điều kiện:** Người dùng đăng nhập tài khoản có quyền `Tính lương-Xem;` trong sheet `PermissionRole`.
- **Các bước:**
  1. Mở URL Web App trên trình duyệt.
  2. Quan sát dropdown `#modal_dataluong_2_ChonThang` và màn hình.
- **Kết quả mong đợi:**
  - Dropdown tháng hiển thị đầy đủ danh sách các tháng làm việc ngay lập tức.
  - Không xuất hiện popup xoay tròn `digicoreSpinner`.
  - Thời gian render sẵn sàng < 500ms.

### TC-02: Làm mới danh sách tháng chủ động (Force Refresh)
- **Mục tiêu:** Kiểm tra nút refresh đồng bộ dữ liệu mới nhất từ Google Sheets.
- **Các bước:**
  1. Thêm một tháng mới vào sheet `DanhMucThang` (ví dụ `09/2026`).
  2. Tại giao diện Web App, bấm nút làm mới (icon xoay tròn cạnh dropdown chọn tháng).
- **Kết quả mong đợi:**
  - Icon refresh xoay tròn hiệu ứng `fa-spin`.
  - Hiển thị toast thông báo: *"Đang đồng bộ danh sách tháng mới nhất..."* sau đó là *"Đã cập nhật danh sách tháng thành công!"*.
  - Dropdown tháng được nạp lại và xuất hiện tháng mới vừa thêm.

---

## 2. Negative & Security Test Cases (Bảo mật & Phân quyền)

### TC-03: Mở trang Web App với tài khoản chưa phân quyền
- **Mục tiêu:** Đảm bảo người dùng không có quyền bị chặn ngay từ `doGet`.
- **Tiền điều kiện:** Đăng nhập tài khoản không có quyền trong sheet `PermissionRole` hoặc truy cập ẩn danh.
- **Các bước:**
  1. Mở URL Web App trên trình duyệt.
- **Kết quả mong đợi:**
  - Nhận trang thông báo từ chối truy cập rõ ràng (`TRUY CẬP BỊ TỪ CHỐI`).
  - Không render giao diện quản trị hay rò rỉ metadata cấu hình.

### TC-04: Gọi trực tiếp Core API không kèm token bí mật
- **Mục tiêu:** Kiểm tra Centralized Auth Gate tại Core API.
- **Các bước:**
  1. Gửi request HTTP GET trực tiếp tới `url_api_doGet` không kèm tham số `token` (hoặc gửi token sai).
  2. Thử nghiệm với route mặc định (không `type`) và các route nghiệp vụ (ví dụ `?type=taoBangTongHopLuong`).
- **Kết quả mong đợi:**
  - Core API trả về mã lỗi JSON: `{"status":"error","message":"Unauthorized: Invalid or missing API token."}`.
  - Handler nghiệp vụ không được thực thi.

### TC-05: Gọi Core API thông qua Client Proxy hợp lệ
- **Mục tiêu:** Kiểm tra Client Proxy đính kèm token server-side thành công.
- **Các bước:**
  1. Dùng tài khoản hợp lệ bấm nút xuất Excel hoặc xem bảng in trên Web App.
- **Kết quả mong đợi:**
  - Client Proxy tự động lấy `API_SECRET_TOKEN` từ `PropertiesService` server-side và gọi Core API thành công, trả về kết quả chính xác.

---

## 3. Performance & Asset Verification

### TC-06: Xác nhận gỡ bỏ DataTables CDN Assets
- **Mục tiêu:** Đảm bảo trang chủ không tải thư viện DataTables dư thừa.
- **Các bước:**
  1. Mở tab Network (F12) trên trình duyệt và tải lại trang.
  2. Lọc các file `.js` và `.css`.
- **Kết quả mong đợi:**
  - Không có bất kỳ request nào tới các file DataTables CSS/JS (`jquery.dataTables.min.js`, `dataTables.bootstrap5.min.js`, `responsive`, `buttons`).
  - Trang chỉ tải Bootstrap 5, FontAwesome, jQuery và Select2.
