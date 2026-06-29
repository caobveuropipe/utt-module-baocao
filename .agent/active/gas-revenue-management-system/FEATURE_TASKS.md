# FEATURE_TASKS: Hệ thống quản lý doanh thu Clinic (Google Apps Script)

Trạng thái: ✅ Hoàn thành

## Phase 1: SPA UI Framework & Fixed Sidebar
- [x] Task 1.1: Xây dựng Layout chính (src/Client/index.html, src/Client/styles.html, src/Client/scripts.html).
- [x] Task 1.2: Thiết kế giao diện Dashboard và các bảng báo cáo theo phong cách CRM (src/Client/index.html).
- [x] Task 1.3: Xử lý logic chuyển đổi giữa các module (src/Client/scripts.html).
- [x] Task 1.4: 🧪 Test & Verify Phase 1 (Kiểm tra độ mượt của giao diện và tính responsive).

## Phase 2: Foundation & Masterdata Integration
- [x] Task 2.1: Setup `src/doGet/doGet.gs` để render giao diện và kết nối UI với backend qua `google.script.run`.
- [x] Task 2.2: Xây dựng module `src/Service_Auth.gs` để map Google Email với Role và ID từ sheet `PhanQuyen`.
- [x] Task 2.3: Implement logic tìm kiếm và liên kết Spreadsheet ID theo Năm/Tháng người dùng chọn.
- [x] Task 2.4: 🧪 Test & Verify Phase 2 (Dữ liệu mẫu từ Masterdata hiển thị đúng lên Dashboard).

## Phase 3: Data Management & Excel Upload
- [x] Task 3.1: Xây dựng UI và Logic Upload Excel (Database/CodeFS/Customer) và xử lý lưu vào Sheets/Drive.
- [x] Task 3.2: Tạo giao diện CRUD (Thêm/Sửa/Xóa) cho Code FS và Danh sách khách hàng.
- [x] Task 3.3: Implement tính năng Xóa dữ liệu cũ theo khoảng thời gian trước khi upload bản mới.
- [x] Task 3.4: 🧪 Test & Verify Phase 3 (Upload thực tế và kiểm tra tính toàn vẹn dữ liệu trong DB).

## Phase 4: Revenue Allocation Logic
- [x] Task 4.1: Implement core logic `src/Service_Allocation.gs` (chia 7:3, 5:5, BS Hà 4:6).
- [x] Task 4.2: Gắn logic tính toán vào 5 loại báo cáo đã dựng ở Phase 1.
- [x] Task 4.3: Thêm tính năng Export Excel phía Client-side cho tất cả báo cáo.
- [x] Task 4.4: 🧪 Test & Verify Phase 4 (Đối chiếu kết quả tính toán với dữ liệu thực tế và xuất file Excel).

## Execution Log
- 2026-04-13: Hoàn thành 100% dự án. Hệ thống quản lý doanh thu Clinic đã sẵn sàng triển khai trên Google Apps Script.
