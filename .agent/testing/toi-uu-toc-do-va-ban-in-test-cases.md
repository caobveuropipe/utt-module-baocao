# Test Cases: Tối Ưu Tốc Độ Xử Lý & Tạo Bản In (Kho Bạc & Hạch Toán)

> **Feature Slug**: `toi-uu-toc-do-va-ban-in`  
> **Phạm vi**: 100% In-memory calculation, Sheets API v4 Reader, XSS Escaping, Auth Gate, Progress Bar & Async Popup  
> **Ngày thực hiện**: 2026-08-22  

---

## 1. Nhóm Kiểm Thử Chức Năng & Hiệu Năng (Happy Path)

| Mã test | Tên test case | Các bước thực hiện | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|
| **HP-01** | Tạo bản in Bảng Tổng Hợp Lương (In-memory) | 1. Chọn tháng `T06.2026`<br>2. Chọn cơ sở "Tất cả" hoặc "Hà Nội"<br>3. Bấm "In Báo Cáo" | - Spinner xoay kèm Progress Bar tăng dần (`5% -> 92% -> 100%`)<br>- Thời gian xử lý < 2.5s<br>- Tab in mở sau khi hoàn tất dữ liệu, số liệu khớp chính xác 100% | ✅ Pass |
| **HP-02** | Tạo bản in Bảng TH Bảo Hiểm (Pure numeric data) | 1. Chọn tháng `T06.2026`<br>2. Bấm In Bảng TH Bảo Hiểm | - 100% ô số liệu trả về là số thực đã định dạng, không xuất hiện chuỗi `=SUM(...)`<br>- Lề phải giảm 15mm, chữ 9.2pt không bị wrap text | ✅ Pass |
| **HP-03** | Tạo bản in Bảng TH Khoản Trừ | 1. Chọn tháng `T06.2026`<br>2. Bấm In Bảng TH Khoản Trừ | - Bảng hiển thị Portrait A4, giãn dòng 50% (`line-height: 1.55; padding: 4.5px 2px`) | ✅ Pass |
| **HP-04** | Tạo bản in Bảng Hạch Toán KPCĐ | 1. Chọn tháng `T06.2026`<br>2. Bấm In Bảng Hạch toán KPCĐ | - Tiêu đề cột `Đoàn phí công đoàn 2%`<br>- Cột Nội dung thu hẹp 1/3, cột Ghi chú mở rộng 250px<br>- Không giãn dòng thừa, layout vừa vặn 1 trang | ✅ Pass |
| **HP-05** | Tạo bản in Bảng Hạch Toán Bảo Hiểm (Landscape) | 1. Chọn tháng `T06.2026`<br>2. Bấm In Bảng Hạch toán BH | - Lề trái A4 Landscape tăng lên 16mm (dễ đóng gáy)<br>- Toàn bộ 11 cột hiển thị vừa khít trong 1 trang | ✅ Pass |

---

## 2. Nhóm Kiểm Thử UI/UX & Tương Tác (Edge Cases)

| Mã test | Tên test case | Các bước thực hiện | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|
| **UX-01** | Hủy thực thi khi đang tải dữ liệu | 1. Bấm in một báo cáo bất kỳ<br>2. Trong khi spinner đang chạy, bấm nút đỏ "Hủy thực thi" | - Modal spinner đóng ngay lập tức<br>- Request bị abort, không mở thêm bất kỳ tab in nào<br>- Toast thông báo "Đã dừng thực thi theo yêu cầu" | ✅ Pass |
| **UX-02** | Fallback chống chặn Popup trình duyệt | 1. Giả lập trình duyệt chặn popup `window.open` bất đồng bộ<br>2. Bấm in báo cáo | - Tự động kích hoạt cơ chế `Blob URL` tải và mở tab in mượt mà, không bị mất bản in | ✅ Pass |
| **UX-03** | Lọc theo địa phương (Hà Nội, Phú Thọ) | 1. Chọn từng địa phương trong dialog<br>2. Xuất bản in | - Dữ liệu được lọc chính xác theo nhân sự thuộc địa phương tương ứng | ✅ Pass |

---

## 3. Nhóm Kiểm Thử Bảo Mật & Xác Thực (Security & Fail-Closed)

| Mã test | Tên test case | Các bước thực hiện | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|
| **SEC-01** | Fail-Closed Centralized Auth Gate | 1. Gọi Core API với token rỗng hoặc sai token | - Server từ chối ngay lập tức với mã 401/403 Unauthorized | ✅ Pass |
| **SEC-02** | Khóa quyền RPC `Tính lương-Xem` | 1. Giả lập user chưa được cấp quyền `Tính lương-Xem`<br>2. Gọi bất kỳ hàm `pg1_ed1_getPrintData*` | - Ném Exception "Bạn không có quyền thực hiện chức năng này" và từ chối xử lý | ✅ Pass |
| **SEC-03** | Chống tấn công XSS (HTML Injection) | 1. Chèn payload `<script>alert('XSS')</script>` vào tên đơn vị / nội dung | - Hàm `escapeHtml` biến đổi thành `&lt;script&gt;`, hiển thị dạng text thuần an toàn | ✅ Pass |
