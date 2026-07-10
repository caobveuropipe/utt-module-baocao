# FEATURE_PLAN: Giao diện quản lý phân quyền (Admin Permission UI)

## 1. Bối cảnh và Mục tiêu
Hiện tại hệ thống đã có logic kiểm tra quyền của người dùng hiện tại, nhưng Admin phải sửa trực tiếp trong Google Sheets nếu muốn cấp quyền cho nhân viên mới. Feature này cung cấp giao diện trực quan trên Web App để thực hiện các thao tác Management.

### Mục tiêu chính:
- Hiển thị danh sách tất cả người dùng và quyền hạn từ sheet `PhanQuyen`.
- Quản lý phân quyền chi tiết (Granular) theo từng báo cáo/màn hình.
- Bảo mật dữ liệu: User chỉ thấy dữ liệu của chính mình; Leader/Admin thấy toàn bộ.
- Cung cấp giao diện chọn báo cáo thân thiện.

## 2. In Scope / Out of Scope
### In Scope:
- Mở rộng sheet `PhanQuyen`: Thêm cột `AllowedReports`.
- Giao diện bảng (`#view-permissions`) hỗ trợ hiển thị danh sách quyền chi tiết.
- Modal Thêm/Sửa tích hợp hệ thống Checkbox chọn báo cáo.
- Logic lọc dữ liệu báo cáo (Filter by EmployeeId) tại Backend cho Role User.
- API và Proxy hỗ trợ lưu trữ mảng quyền hạn.

### Out of Scope:
- Phân quyền chi tiết đến từng cột dữ liệu (chỉ phân theo Role: Admin, Leader, User).
- Lịch sử thay đổi quyền (Audit log).

## 3. Acceptance Criteria
- [ ] Admin có thể xem được danh sách toàn bộ người dùng đang có quyền truy cập.
- [ ] Thêm được người dùng mới (Email, Tên, ID, Role).
- [ ] Có thể thay đổi Role của một người dùng hiện có.
- [ ] Xóa được một dòng phân quyền.
- [ ] Chỉ User có role `Admin` mới thấy và truy cập được menu này (UI-level protection).

## 4. Files bị ảnh hưởng
- `doget/Service_Auth.gs`: Thêm hàm CRUD cho sheet `PhanQuyen`.
- `doget/doGet.gs`: Thêm routing cho các action mới.
- `client/Code.gs`: Thêm các hàm proxy gọi sang Project doget.
- `client/index.html`: Thêm markup cho `#view-permissions`.
- `client/scripts.html`: Thêm JS xử lý tương tác.

## 5. Chiến lược triển khai
### Phase 1: Backend CRUD Logic
- Viết các hàm `getAllPermissions`, `updateUserPermission`, `deleteUserPermission` tại `Service_Auth.gs`.
- Mở rộng lệnh `doGet` để tiếp nhận các action này.

### Phase 2: Frontend UI Implementation
- Dựng bảng danh sách và Form Modal (dùng SweetAlert2) để thêm/sửa.
- Viết JS để fetch dữ liệu khi click vào menu "Phân quyền".

### Phase 4: Granular Permissions & Data Security
- Mở rộng logic CRUD để lưu danh sách báo cáo được phép.
- Thiết kế UI Checkbox list trong Modal và Badge hiển thị trong bảng.
- Triển khai logic lọc dữ liệu tại `Service_Report_Engine.gs` dựa trên Auth Info.

## 6. Test Strategy
- Kiểm tra thêm/sửa/xóa và đối chiếu trực tiếp với dữ liệu trong Google Sheets.
- Thử đăng nhập bằng 1 user thường để đảm bảo menu "Phân quyền" bị ẩn.
