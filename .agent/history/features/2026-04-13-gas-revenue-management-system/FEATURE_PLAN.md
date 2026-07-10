# FEATURE_PLAN: Hệ thống quản lý doanh thu Clinic (Google Apps Script)

## 1. Bối cảnh và Mục tiêu
Xây dựng hệ thống quản lý, báo cáo và phân bổ doanh thu cho phòng khám dựa trên nền tảng Google Apps Script (GAS) và Google Sheets. Hệ thống cần xử lý dữ liệu lớn (chia theo năm), hỗ trợ upload từ Excel, phân quyền người dùng và tự động hóa các báo cáo doanh thu phức tạp.

### Mục tiêu chính:
- Tự động hóa việc đọc/ghi dữ liệu từ Masterdata và các file Database theo năm.
- Triển khai logic phân bổ doanh thu đa bộ phận (BS, Điều dưỡng, Sale/Thu ngân, CSKH).
- Cung cấp giao diện UI/UX hiện đại để quản lý danh mục, upload dữ liệu và xem báo cáo.
- Quản lý phân quyền 3 cấp: Super Admin, Leader, User.

## 2. In Scope / Out of Scope
### In Scope:
- 3 file chính: `doGet.gs` (Read/UI), `doPost.gs` (Write/API), `client.html` (UI/Logic).
- Kết nối Masterdata (Url, PhanQuyen, Code FS, DanhSachKhachHang) với các file Database năm.
- Logic phân bổ doanh thu theo quy tắc:
    - 3 BP trở lên: Chia đều.
    - 2 BP: BS-Sale (7:3), BS-DD (5:5), BS-CSKH (5:5), v.v.
    - Trong BP: BS Hà - BS khác (4:6), BS-BS (chia đều), các BP khác chia đều.
- Các báo cáo: Doanh thu thực hiện, Bán mới, Bán lại, Phụ bác sỹ, Giới thiệu.
- Tính năng: CRUD từng dòng, Filter, Export Excel, Upload Excel, Sync data.
- Phân quyền theo Role và User.

### Out of Scope:
- Kết nối với các phần mềm CRM/ERP bên ngoài (ngoài việc upload Excel).
- Phê duyệt quy trình thanh toán (chỉ dừng ở mức báo cáo doanh thu).

## 3. Đối chiếu Knowledge Base
- **Cấu trúc phân bổ đa tầng**: Đã bao gồm trong scope (tuân thủ quy tắc 7:3, 5:5).
- **Tách biệt dữ liệu gốc và Logic**: Sử dụng GAS làm tầng logic, Sheets làm DB.
- **Dữ liệu theo năm**: Phù hợp với quyết định lưu trữ lớn.

## 4. Giả định và Câu hỏi mở
### Giả định:
- Tất cả 30 người dùng có tài khoản Google (để dùng Identity-based Auth).
- File Excel upload có cấu trúc cột chuẩn như mô tả.
- Tốc độ xử lý của GAS đủ cho 30 user đồng thời (Sheets có giới hạn 100-200 users, nhưng GAS API thì thoải mái hơn).

### Câu hỏi mở:
- [ ] Cấu trúc folder trên Google Drive để lưu trữ các file năm có cần cố định không? (Sẽ dùng Masterdata sheet `Url` để link).

## 5. Acceptance Criteria
- [ ] Truy cập được vào UI thông qua Web App link.
- [ ] Upload file Excel Database/Customer/Code FS thành công và lưu vào đúng sheet/file.
- [ ] Thực hiện được việc chọn Năm/Tháng để lấy dữ liệu.
- [ ] Logic phân bổ doanh thu tính toán chính xác theo `Bao cao chi Le Thuy.txt`.
- [ ] Phân quyền hoạt động: User chỉ thấy dữ liệu của mình, Leader thấy toàn bộ, Admin quản lý được phân quyền.
- [ ] Export được báo cáo ra file Excel.

## 6. Files và Modules bị ảnh hưởng
- `src/doGet/doGet.gs`: Xử lý routing, render UI, và API đọc dữ liệu.
- `src/doPost/doPost.gs`: Xử lý lưu trữ dữ liệu, upload file, và logic cập nhật.
- `src/Client/index.html`: Giao diện chính (SPA Shell).
- `src/Client/styles.html`: CSS cho ứng dụng.
- `src/Client/scripts.html`: Logic client-side.
- `src/Service_Allocation.gs` (Tách riêng cho gọn): Chứa logic phân bổ doanh thu.
- `src/Service_Auth.gs` (Tách riêng): Kiểm tra quyền người dùng.

## 7. Risk Triage và Review Focus
- **Risk Hotspots**: Giới hạn thời gian chạy của GAS (6 phút/request). Khi upload file lớn hoặc tính toán báo cáo năm cần tối ưu performance (Batch update/reading).
- **Security Focus**: Đảm bảo `doPost` kiểm tra quyền (Session/Email) trước khi ghi dữ liệu.
- **Review Focus**: Quy tắc chia 4:6 cho BS Hà và các BS khác cần test kỹ trường hợp có nhiều hơn 2 BS trong 1 nhóm.

## 8. Chiến lược triển khai (UI-FIRST)
### Phase 1: SPA UI Framework & Dashboard
- Xây dựng Layout chính (Sidebar cố định + Header + Main Content).
- Thiết kế giao diện Dashboard và các bảng báo cáo theo phong cách CRM chuyên nghiệp.
- Logic chuyển đổi module phía Client-side.
- Tối ưu UI/UX (CSS Premium, Gradients, Micro-animations).

### Phase 2: Foundation & Masterdata Integration
- Setup `doGet`/`doPost` để kết nối UI với Backend.
- Module Auth & Phân quyền (Mapping Email -> ID).
- Kết nối dữ liệu Masterdata.

### Phase 3: Data Management & Excel Upload
- Tính năng Upload Excel từ UI cho Database, Code FS, Customer List.
- Logic Routing dữ liệu theo Năm/Tháng từ Masterdata.
- CRUD UI thực tế cho các danh mục.

### Phase 4: Revenue Allocation Logic
- Triển khai thuật toán phân bổ doanh thu (chia 7:3, 5:5, BS Hà 4:6).
- Gắn logic tính toán vào các bảng báo cáo đã dựng ở Phase 1.
- Export Excel phía Client.

## 9. Test Strategy
- **Visual Test**: Kiểm tra giao diện trên các thiết bị.
- **Unit Test**: Kiểm tra hàm `allocateRevenue()` với các bộ dữ liệu giả lập.
- **Integration Test**: Luồng đi từ UI -> Upload Excel -> Tính toán -> Báo cáo.
- **UAT**: User kiểm tra độ mượt của giao diện và tính chính xác của dữ liệu lọc.
