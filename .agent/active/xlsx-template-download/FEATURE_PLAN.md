# Feature Plan: Tải mẫu Upload Excel (.xlsx)

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Đã thông qua review hội đồng (2026-04-19)
> **Feature slug**: xlsx-template-download
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-04-19

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hệ thống cho phép upload dữ liệu doanh thu từ file Excel, nhưng người dùng thường không nhớ chính xác các cột cần thiết (headers) để hệ thống có thể phân bổ đúng.
- **Vấn đề cần giải quyết:** Thiếu một file mẫu chuẩn để người dùng tải về tham khảo và nhập liệu đúng định dạng, tránh lỗi "Không tìm thấy cột" khi upload.
- **Mục tiêu:** Thêm nút tải file mẫu (.xlsx) ngay tại giao diện Upload dữ liệu.
- **Kết quả mong đợi:** Người dùng có thể nhấn nút "Tải file mẫu", nhận được 1 file `.xlsx` chứa các header chuẩn mà hệ thống chấp nhận.

## 2. Phạm vi

### In scope
- Cập nhật UI modal Upload (`openUploadModal`) trong `client/scripts.html` để thêm nút "Tải file mẫu".
- Triển khai logic tạo file Excel mẫu bằng thư viện `xlsx` ngay trên trình duyệt (client-side) để tốc độ phản hồi nhanh nhất.
- Đảm bảo header trong file mẫu khớp chính xác với logic phân bổ tại `dopost/Service_Allocation.gs`.

### Out of scope
- Thay đổi logic upload hoặc phân bổ ở phía backend.
- Tạo mẫu cho các loại dữ liệu khác ngoài "Dữ liệu DT" (như Dịch vụ/Sản phẩm, Nhân sự) trong vòng này (có thể làm sau nểu cần).

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** Tôn trọng cấu trúc header đã được defines trong `Service_Allocation.gs` để đảm bảo tính tương thích ngược.
- **"Cấm kỵ" cần tránh:** Không hardcode dữ liệu mẫu vào server làm phình dung lượng dự án; ưu tiên generate on-the-fly.
- **Ràng buộc kiến trúc liên quan:** Sử dụng chung thư viện `xlsx` (SheetJS) đã có sẵn trong Project để nhất quán.

## 4. Giả định và câu hỏi mở

### Giả định
- Người dùng chỉ cần template trắng có header (hoặc kèm 1 dòng ví dụ) để bắt đầu nhập liệu.
- Thư viện `XLSX` (SheetJS) đã được load thành công tại trang `client/index.html`.

### Câu hỏi mở
- [Non-blocking] Có cần thêm dữ liệu ví dụ (sample data) vào file hay chỉ cần Header? (Tạm thời: Chỉ Header và 1 dòng hướng dẫn ẩn).

## 5. Acceptance Criteria

- [ ] Có nút "Tải mẫu Excel" trong modal Upload.
- [ ] File tải về định dạng `.xlsx`, tên file `Mau_Upload_DoanhThu.xlsx`.
- [ ] Header file bao gồm ít nhất: `Ngày hóa đơn`, `Mã hóa đơn`, `Mã KH`, `Khách hàng`, `Dịch vụ & sản phẩm`, `Số lượng`, `Doanh thu (Sau giảm giá)`, và các cột nhân viên tham gia.
- [ ] Upload file vừa tải về (không sửa header) không gây lỗi "Header không hợp lệ".

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `client/scripts.html` | Sửa | Thêm button UI và logic generate template | 🟢 Thấp | JS Client |
| `client/styles.html` | Sửa | Styling cho nút tải mẫu (nếu cần) | 🟢 Thấp | CSS |

## 7. Risk Triage và Review Focus

- **Review required:** Yes (Gate 1 phối hợp UI)
- **Risk hotspots:** Không có rủi ro về dữ liệu hoặc bảo mật vì đây là tính năng sinh file tĩnh.
- **Review focus areas:** Kiểm tra xem danh sách Header đã đầy đủ theo nhu cầu nghiệp vụ của Clinic chưa.

## 8. Chiến lược triển khai

- **Phase strategy:** Triển khai trong 1 phase duy nhất vì tính chất nhỏ gọn.
- **Thứ tự triển khai:**
    1. Định nghĩa mảng Headers chuẩn.
    2. Viết hàm `downloadExcelTemplate()` sử dụng `xlsx`.
    3. Gắn nút vào HTML modal.
- **Điểm cần phối hợp:** Đảm bảo `XLSX` version đang dùng hỗ trợ tốt `xlsx.writeFile`.

## 9. Test Strategy

- **Manual verification:**
    - Mở modal upload, nhấn nút "Tải mẫu".
    - Mở file bằng Excel, kiểm tra các cột.
    - Thử nhập 1 dòng dữ liệu và upload ngược lại hệ thống xem có nhận diện đúng cột không.

## 10. Rollback Plan

- Xóa nút và hàm logic đã thêm trong `client/scripts.html`.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
