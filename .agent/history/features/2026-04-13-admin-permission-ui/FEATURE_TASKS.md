# FEATURE_TASKS: Giao diện quản lý phân quyền (Admin Permission UI)

> **Trạng thái**: ✅ Hoàn thành hệ thống Phân quyền chi tiết
> **Review gate**: ✅ ĐỒNG Ý

## Phase 1: Backend CRUD & Proxy (Done)
- [x] Task 1.1: Bổ sung logic CRUD (Get, Save, Delete) tại `doget/Service_Auth.gs`.
- [x] Task 1.2: Cập nhật `doget/doGet.gs` để expose các hàm qua API action.
- [x] Task 1.3: Thêm các hàm trung chuyển (Proxy) tại `client/Code.gs`.
- [x] Task 1.4: 🧪 Test & Verify Phase 1.

## Phase 2: UI Implementation (Done)
- [x] Task 2.1: Bổ sung markup `<div id="view-permissions">` vào `client/index.html`.
- [x] Task 2.2: Viết JS `loadPermissions()` và `renderPermissionsTable()` trong `client/scripts.html`.
- [x] Task 2.3: Tích hợp SweetAlert2 để tạo form Thêm/Sửa người dùng.
- [x] Task 2.4: Logic gỡ bỏ quyền (Delete) kèm xác nhận.
- [x] Task 2.5: 🧪 Test & Verify Phase 2.

## Phase 3: Basic Security & Polish (Done)
- [x] Task 3.1: Ẩn/Hiện menu Phân quyền dựa trên Role của User đăng nhập.
- [x] Task 3.2: Tối ưu UI (Empty state, loading indicator).
- [x] Task 3.3: 🧪 Final Review & Handover.

## Phase 4: Granular Permissions & Data Security
- [x] Task 4.1: Cập nhật sheet `PhanQuyen` (thêm cột F) và nâng cấp logic Save trong `dopost/Service_Auth.gs`.
- [x] Task 4.2: Nâng cấp Modal UI với danh sách Checkbox chọn báo cáo.
- [x] Task 4.3: Triển khai kiểm tra quyền truy cập menu/báo cáo tại Frontend (ẩn các module không được cấp quyền).
- [x] Task 4.4: Áp dụng logic lọc dữ liệu theo `EmployeeID` cho Role User trong `doget/Service_Report_Engine.gs`.
- [x] Task 4.5: 🧪 Test & Verify Phase 4 (Login thử bằng User thường để kiểm tra tính bảo mật).

## Execution Log
- 2026-04-13: Khởi tạo plan và task.
