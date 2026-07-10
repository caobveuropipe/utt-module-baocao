# Feature Plan: Thêm chức năng Trừ KPCĐ và Các quỹ

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Đã thông qua feature-review. Sẵn sàng thực thi.
> **Feature slug**: add-other-functions-deduct-union-fees
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-04-28

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Người dùng cần một báo cáo mới để theo dõi các khoản trừ Kinh phí công đoàn (KPCĐ) và các quỹ khác từ bảng lương.
- **Vấn đề cần giải quyết:** Hiện tại chưa có báo cáo chuyên biệt cho việc trừ KPCĐ và các quỹ theo mẫu được cung cấp trong hình ảnh.
- **Mục tiêu:** 
    - Thêm mục "Chức năng khác" vào giao diện chính.
    - Thêm nút/card "Trừ KPCĐ và Các quỹ" cho phép xuất báo cáo theo địa phương (Hà Nội, Phú Thọ).
    - Báo cáo hỗ trợ xuất Excel và In trực tiếp (PDF).
    - Dữ liệu lấy hoàn toàn từ `DataLuong1`.
- **Kết quả mong đợi:** Người dùng có thể chọn tháng, chọn địa phương và nhận được file báo cáo "DANH SÁCH TRỪ KP CÔNG ĐOÀN VÀ CÁC QUỸ" với dữ liệu chính xác và sắp xếp theo đơn vị giống "Bảng đi kho bạc".

## 2. Phạm vi

### In scope
- Thêm section "Chức năng khác" vào `client/pg_general_2.html`.
- Thêm card "Trừ KPCĐ và Các quỹ" vào section mới.
- Thêm logic xử lý client-side trong `client/pg_general_4.html`.
- Thêm route mới `taoBangTruKPCDVaCacQuy` trong `doGet/Code.js`.
- Tạo file logic backend `doGet/doGet_tongHopTruKPCDVaCacQuy.js`.
- Mapping dữ liệu từ `DataLuong1` (Headers: `ID`, `Kỳ lương`, `Mã CB`, `Họ và tên`, `KPCĐ`, `Trừ khác`, ...):
    - **Mã CB** -> Cột "Mã CB"
    - **Họ và tên** -> Cột "Họ và tên"
    - **KPCĐ** -> Cột "KPCĐ"
    - **Trừ khác** -> Cột "Quỹ tình nghĩa"
    - **Các khoản thu khác** -> Để trống.
    - **Ghi chú** -> Để trống.
- Sắp xếp dữ liệu theo "Mã đơn vị" từ `DataChotNSThang`.
- Loại bỏ nhân viên (Exclusion logic) y chang "Bảng đi kho bạc".

### Out of scope
- Thay đổi cấu trúc dữ liệu trong `DataLuong1`.
- Các báo cáo khác không liên quan.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** 
    - Kiến trúc 3-module (client/doGet/doPost).
    - Sử dụng `pg_general_4_exportReportGeneric` để xuất báo cáo.
    - Sử dụng `GLOBAL_CONFIG` để quản lý ID file và tên sheet.
- **"Cấm kỵ" cần tránh:** Tránh hardcode ID file trực tiếp trong code logic; nên đưa vào `GLOBAL_CONFIG`.
- **Ràng buộc kiến trúc liên quan:** Phải lọc theo địa phương (`location`) và kỳ lương (`monthStr`) như các báo cáo hiện có.

## 4. Giả định và câu hỏi mở

### Giả định
- Sẽ sử dụng một Spreadsheet template mới cho báo cáo này. (Tạm thời dùng ID placeholder nếu chưa có).
- Footer chỉ bao gồm "Số tiền bằng chữ" và "Người lập".

### Câu hỏi mở
- [Non-blocking] Cần xác nhận ID của file Spreadsheet dùng làm template cho báo cáo này.

## 5. Acceptance Criteria

- [ ] Giao diện có mục "Chức năng khác" và card "Trừ KPCĐ và Các quỹ".
- [ ] Khi bấm vào card, hiện dialog chọn địa phương (Tất cả, Hà Nội, Phú Thọ) và định dạng (In/Excel).
- [ ] Báo cáo Excel/PDF xuất ra có tiêu đề "DANH SÁCH TRỪ KP CÔNG ĐOÀN VÀ CÁC QUỸ".
- [ ] Các cột STT, Mã CB, Họ và tên, KPCĐ, Quỹ tình nghĩa, Các khoản thu khác được hiển thị đúng.
- [ ] Dữ liệu được sắp xếp theo Mã đơn vị (giống Bảng đi kho bạc).
- [ ] Footer hiển thị đúng "Số tiền bằng chữ" và "Người lập".

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `client/pg_general_2.html` | Sửa | Thêm UI section và card mới | 🟢 Thấp | Có |
| `client/pg_general_4.html` | Sửa | Thêm hàm wrapper để gọi API | 🟢 Thấp | Có |
| `doGet/Code.js` | Sửa | Đăng ký route và thêm ID file vào CONFIG | 🟢 Thấp | Có |
| `doGet/doGet_tongHopTruKPCDVaCacQuy.js` | Tạo mới | Xử lý logic tổng hợp và tạo báo cáo | 🟡 Trung bình (Logic mapping) | Chưa |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Mapping cột dữ liệu từ `DataLuong1`.
- **Review focus areas:** 
    - Logic sắp xếp theo Mã đơn vị có hoạt động đúng với `DataChotNSThang` không?
    - Định dạng báo cáo (merge cells, borders) có giống mẫu trong ảnh không?
- **Known pitfalls / historical issues:** Việc lấy sai index cột khi header thay đổi.
- **Dependencies / rollout concerns:** Cần một file Spreadsheet làm template hoặc đích đến cho báo cáo.

## 8. Chiến lược triển khai

- **Phase strategy:** 
    - Phase 1: Cập nhật UI và Routing.
    - Phase 2: Triển khai logic backend tổng hợp dữ liệu.
    - Phase 3: Hoàn thiện định dạng báo cáo và tích hợp In/Export.
- **Thứ tự triển khai:** UI -> Routing -> Backend -> Testing.
- **Yêu cầu migration / config / deploy:** Cập nhật `GLOBAL_CONFIG` trong `Code.js`.

## 9. Test Strategy

- **Manual verification:** 
    - Kiểm tra hiển thị UI trên Web App.
    - Xuất thử báo cáo cho Hà Nội, Phú Thọ và so sánh số liệu với `DataLuong1`.
    - Kiểm tra thứ tự sắp xếp nhân viên.
- **Data preparation:** Sử dụng dữ liệu tháng hiện tại trong `DataLuong1` để verify.

## 10. Rollback Plan

- Khôi phục phiên bản trước của `pg_general_2.html`, `pg_general_4.html` và `Code.js`. Xóa file `doGet_tongHopTruKPCDVaCacQuy.js`.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
