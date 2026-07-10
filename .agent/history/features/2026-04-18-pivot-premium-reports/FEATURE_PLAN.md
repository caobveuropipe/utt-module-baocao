# Feature Plan: Pivot Premium Reports System

## 1. Bối cảnh & Mục tiêu
Hệ thống cần cung cấp 5 loại báo cáo quản trị doanh thu với giao diện chuyên nghiệp (Premium). Yêu cầu đặc biệt là dữ liệu phải được trình bày dưới dạng Pivot (Cột là Nhân viên, Hàng là Nhãn hàng LV2) và có dòng tổng hợp gióng hàng phía trên.

**Mục tiêu:**
- Tự động hóa việc phân bổ doanh thu theo logic đa tầng (Bộ phận 7:3/5:5, Nội bộ BS 4:6).
- Tối ưu hiệu suất bằng cách phân bổ sẵn dữ liệu khi Upload.
- Giao diện báo cáo trực quan, sang trọng, hỗ trợ Summary Row.

## 2. Scope (Phạm vi)

### In-Scope
- **Database (Sheets):**
  - Cấu trúc `DanhMucSPDV`: STT, Mã, Tên, LV1-LV8, Dịch vụ bác sĩ làm (Checkbox), Code FS.
  - Cấu trúc `DanhSachNhanVien`: STT, Mã NV, Họ tên, Bộ phận (BS, DD, Sale, CSKH).
  - Sheet trung gian `BaoCao_PhanBo`: Lưu dữ liệu đã áp tỷ lệ chia để làm nguồn cho Pivot.
- **Logic Backend:**
  - `Service_Allocation`: Engine tính toán phân bổ dựa trên 15 cột nhân sự và quy tắc 7:3/5:5/4:6.
  - Mapping dịch vụ sang LV2 từ danh mục.
- **Frontend UI:**
  - Layout Pivot động (Dynamic Columns).
  - Summary Header Row (Trung bình, Tổng cộng) nằm trên bảng chính.
  - CSS Premium (Tone Gold/Brown/Black).

### Out-of-Scope
- Thay đổi định dạng file Excel gốc của người dùng.
- Hệ thống chấm công hoặc tính lương chi tiết ngoài doanh thu.

## 3. Đối chiếu Knowledge Base (KB)
- Tuân thủ quy tắc BS:Sale = 7:3 đã chốt trong KB.
- Tiếp tục duy trì mô hình Multi-project (Client, doGet, doPost).

## 4. Giả định & Câu hỏi mở
- **Giả định:** Tên nhân viên trong các cột 1-15 có thể dùng để tra cứu duy nhất trong Danh sách nhân viên (hoặc dùng Mã NV nếu có trong file thô).
- **Câu hỏi:** Trong file Excel thô, các cột "Nhân viên 1..." hiện đang chứa Tên hay Mã nhân viên? (Tạm phục vụ phương án B là tra cứu theo Tên/Mã để lấy Bộ phận).

## 5. Acceptance Criteria
1. Xem được 5 loại báo cáo với đúng logic lọc và phân bổ.
2. Bảng báo cáo hiển thị cột là Tên nhân viên, Hàng là Nhãn LV2.
3. Dòng tổng hợp (Tổng cộng, Trung bình) hiển thị phía trên và thẳng hàng với các cột dữ liệu.
4. Thời gian tải báo cáo < 3 giây (nhờ dữ liệu đã phân bổ sẵn).
5. Giao diện đồng nhất theo style Hình 1 của User.

## 6. Files & Modules bị ảnh hưởng
- `doget/Service_Report_Engine.gs`: Cập nhật logic lấy dữ liệu Pivot.
- `dopost/Service_Import.gs` & `Service_Allocation.gs`: Cập nhật logic xử lý khi Upload để lưu vào sheet phân bổ.
- `client/index.html`, `scripts.html`, `styles.html`: Thay đổi toàn bộ giao diện rendering báo cáo.

## 7. Risk Triage & Review Focus
- **Rủi ro 1 - Sai lệch số liệu:** Logic 4:6 (BS Hà) và 7:3 nếu không test kỹ sẽ gây sai lệch tài chính. 
- **Focus:** Kiểm tra kỹ Service_Allocation với các test case: 1 người làm, nhiều người khác bộ phận làm, có BS Hà và không có BS Hà.
- **Rủi ro 2 - Hiệu suất:** Dữ liệu Excel lớn. 
- **Focus:** Xử lý Batch Processing khi import.

## 8. Chiến lược triển khai
- **Phase 1:** Thiết lập danh mục & Danh sách nhân viên.
- **Phase 2:** Nâng cấp Backend Allocation Engine (Phân bổ khi upload).
- **Phase 3:** Xây dựng UI Pivot Premium & Summary Row.
- **Phase 4:** Hoàn thiện 5 loại báo cáo cụ thể.
