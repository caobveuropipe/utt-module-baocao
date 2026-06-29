# Feature Plan: Đồng bộ số trang và gom nhóm chữ ký cho Bảng tổng hợp lương (Dikhobac)

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Đã qua cổng review
> **Feature slug**: print-page-numbering-layout
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-06-26

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Bản in "Bảng tổng hợp lương" (`generateLuongHtml`) của dự án `Dikhobac` hiện tại chưa được định dạng số trang tự động và chưa chống ngắt trang mồ côi cho dòng "Tổng cộng" cùng block chữ ký.
- **Vấn đề cần giải quyết:** 
  - Thiếu số trang chân trang khi xuất in/PDF.
  - Dòng Tổng cộng và chữ ký có thể bị ngắt đôi sang trang mới ngoài ý muốn.
- **Mục tiêu:** Áp dụng xử lý số trang tự động bằng CSS native `@page` (học hỏi từ dự án `Luong2`) và bảo vệ ngắt trang cho dòng Tổng cộng + block chữ ký (đồng bộ với Bảng đi kho bạc).
- **Kết quả mong đợi:** 
  - Bản in "Bảng tổng hợp lương" hiển thị "Trang X" ở chân trang bên phải.
  - Dòng Tổng cộng luôn nằm chung trang với ít nhất một phần hoặc toàn bộ block chữ ký (không bị ngắt trang riêng lẻ).

## 2. Phạm vi

### In scope
- Sửa đổi hàm `generateLuongHtml` trong file [pg_general_3.html](file:///d:/Project/UoTT/Dikhobac/client/pg_general_3.html).
- Bổ sung cấu hình `@page` cho in ấn dọc (Portrait) với lề chuẩn và số trang.
- Thêm CSS `break-after: avoid` cho dòng Tổng cộng và wrapper chống ngắt trang `break-inside: avoid` cho block chữ ký.

### Out of scope
- Sửa đổi các file thuộc dự án `Luong2` (đảm bảo nguyên tắc không sửa gì trong folder Luong2).

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** Dùng CSS native thay vì phân trang JavaScript để đảm bảo tính linh hoạt khi in trực tiếp từ trình duyệt.

## 4. Giả định và câu hỏi mở

### Giả định
- Khổ giấy in cho bảng tổng hợp lương là A4 dọc (Portrait) với lề: Top `12mm`, Right `15mm`, Bottom `14mm`, Left `15mm`.

### Open Questions
- Không có câu hỏi blocking.

## 5. Acceptance Criteria

- [ ] Bản in "Bảng tổng hợp lương" hiển thị số trang dạng "Trang X" ở góc dưới bên phải mỗi trang.
- [ ] Dòng Tổng cộng và các chữ ký ("Người lập", "Kế toán trưởng", "Ban giám hiệu") luôn xuất hiện trên cùng một trang, không bị chia cắt làm dòng Tổng cộng nằm đơn lẻ ở trang trước.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| [pg_general_3.html](file:///d:/Project/UoTT/Dikhobac/client/pg_general_3.html) | Sửa | Cập nhật CSS `@page` và gán class `.row-total`, wrapper chữ ký `.sig-section-wrapper` trong hàm `generateLuongHtml`. | 🟢 Thấp | Không |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Đảm bảo responsive kích thước cột không bị tràn lề phải sau khi thêm margin trang in.

## 8. Chiến lược triển khai

- **Phase strategy:** 
  - Phase 1: Cập nhật CSS và HTML của hàm `generateLuongHtml` trong [pg_general_3.html](file:///d:/Project/UoTT/Dikhobac/client/pg_general_3.html).
  - Phase 2: Xác thực hiển thị in PDF thực tế.

## 9. Test Strategy

- **Manual verification:**
  - Nhấp "In bảng tổng hợp lương" trên giao diện, kiểm tra xem chân trang có số trang chưa.
  - Giả lập dữ liệu dài để kiểm tra dòng Tổng cộng và chữ ký có tự động nhảy trang cùng nhau hay không.

## 10. Rollback Plan

- Khôi phục file [pg_general_3.html](file:///d:/Project/UoTT/Dikhobac/client/pg_general_3.html) về bản backup gần nhất.
