# Feature Tasks: Pivot Premium Reports System

Status: 🏗️ ĐANG THỰC HIỆN
Slug: pivot-premium-reports

## Phase 1: Nền tảng dữ liệu & Danh mục
- [x] Task 1.1: Tạo sheet `DanhMucSPDV` trong file Masterdata với cấu trúc cột đã thống nhất.
- [x] Task 1.2: Tạo sheet `DanhSachNhanVien` trong file Masterdata (Họ tên, Mã NV, Bộ phận).
- [x] Task 1.3: Tạo sheet `BaoCao_PhanBo` trong file Database năm (ví dụ 2026) để làm database trung gian.
- [x] Task 1.4: Viết hàm helper `getStaffDepartment(nameOrId)` tra cứu từ danh sách nhân viên.
- [x] Task 1.5: 🧪 Test & Verify Phase 1: Đàm bảo tra cứu mapping danh mục và nhân viên hoạt động đúng.

## Phase 2: Allocation Engine (Phân bổ khi Upload)
- [x] Task 2.1: Cập nhật `dopost/Service_Allocation.gs`: Implement logic chia 7:3 (BS:Sale) và 5:5 (BS:DD).
- [x] Task 2.2: Implement logic chia nội bộ BS 4:6 (BS Hà : BS Khác).
- [x] Task 2.3: Cập nhật `dopost/Service_Import.gs`: Khi upload, lặp qua 15 cột nhân sự, tính tiền phân bổ và ghi vào sheet `BaoCao_PhanBo`.
- [x] Task 2.4: Xử lý logic doanh thu đặc biệt (Tổng - Mua thẻ + Trừ thẻ).
- [x] Task 2.5: 🧪 Test & Verify Phase 2: Import 1 file mẫu và kiểm tra sheet `BaoCao_PhanBo` có khớp tổng doanh thu không.

## Phase 3: Premium UI & Pivot Engine
- [x] Task 3.1: Cập nhật `client/styles.html`: Thiết kế CSS cho Summary Table và Pivot Table (Tone Gold/Brown).
- [x] Task 3.2: Viết hàm `renderPivotReport(data)` trong `client/scripts.html` để render bảng động.
- [x] Task 3.3: Cập nhật `doget/Service_Report_Engine.gs`: Viết API trả về dữ liệu từ sheet `BaoCao_PhanBo`.
- [x] Task 3.4: Implement "Summary Row" ở phía trên bảng báo cáo, đảm bảo alignment.
- [x] Task 3.5: 🧪 Test & Verify Phase 3: Kiểm tra hiển thị trên trình duyệt, alignment của Summary Row.

## Phase 4: Hoàn thiện 5 loại báo cáo
- [x] Task 4.1: Cấu hình logic lọc cho "Doanh thu thực hiện" (Nhân viên 1-5).
- [x] Task 4.2: Cấu hình logic cho "Bán mới" & "Bán lại" (Dựa trên Loại SP&DV).
- [x] Task 4.3: Cấu hình logic cho "Phụ BS" & "Giới thiệu".
- [/] Task 4.4: 🧪 Test & Verify Phase 4: Đối soát số liệu cả 5 báo cáo với file Excel mẫu của User.

## Execution Log
- 2026-04-18: Resume feature `pivot-premium-reports`.
- 2026-04-18: Phase 2 - Task 2.1, 2.2, 2.3, 2.4 đã được triển khai trong code.
- 2026-04-18: Phase 2 - Bắt đầu Task 2.5: Test & Verify logic phân bổ.
- 2026-04-18: Chạy test script thành công cho các trường hợp: 7:3 (BS:Sale), 5:5 (BS:DD), 4:6 (BS Hà), isDoctorOnly, và lọc "Mua thẻ".
- 2026-04-18: Phase 2 - Hoàn thành. Chờ User xác nhận để sang Phase 3.
- 2026-04-18: Phase 3 - Đã cập nhật giao diện Premium (Dark/Gold), triển khai Pivot Engine và Summary Header Row.
- 2026-04-18: Phase 3 - Bắt đầu Task 3.5: Kiểm thử hiển thị UI.
- 2026-04-18: UI Polishing - Sửa lỗi font Tiếng Việt (mojibake) và đổi text nút chọn file theo yêu cầu User.
- 2026-04-18: Thêm tính năng xóa file đã chọn sai trong danh sách upload bằng cách quản lý mảng selectedFiles độc lập.
- 2026-04-18: Phase 4 - Task 4.1, 4.2, 4.3 hoàn thành logic mapping 5 loại báo cáo trong Service_Allocation.
- 2026-04-18: Bắt đầu Task 4.4: Deploy và kiểm thử đối soát số liệu.
