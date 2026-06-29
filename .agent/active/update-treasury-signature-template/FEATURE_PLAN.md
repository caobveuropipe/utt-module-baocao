# Feature Plan: Cập nhật mẫu chữ ký bảng đi kho bạc

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: User bỏ qua review với rủi ro đã nêu
> **Feature slug**: update-treasury-signature-template
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-05-19

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Bảng đi kho bạc khi in ra phần chữ ký cần được phân tách rõ các khu vực dành cho Ngân hàng và xử lý yêu cầu.
- **Vấn đề cần giải quyết:** 
  - Thiếu 2 dòng chữ phía trên "Cán bộ tiếp nhận":
    ```text
    Phần dành cho ngân hàng
    I/Xác nhận dành cho bộ phận tiếp nhận yêu cầu
    ```
  - Thiếu 1 dòng chữ phía trên "Giao dịch viên":
    ```text
    II/Phần xác nhận dành cho bộ phận xử lý yêu cầu
    ```
- **Mục tiêu:** Cập nhật lại mẫu phần chữ ký ở file HTML in cho phù hợp với biểu mẫu quy chuẩn của ngân hàng.
- **Kết quả mong đợi:** Phần chữ ký hiển thị đúng như trong ảnh tham chiếu (ảnh 2) khi in bảng chuyển khoản ngân hàng (landscape).

## 2. Phạm vi

### In scope
- Cập nhật hàm `generateCkHtml(res, location)` trong `client/pg_general_3.html` để thêm các dòng chữ nhãn tương ứng vào cột chữ ký bên trái.

### Out of scope
- Không thay đổi các phần chữ ký của các báo cáo khác (Thuyết minh lương, KPCĐ...).
- Không thay đổi logic truy vấn dữ liệu từ Google Sheets hay Apps Script backend.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** HTML in ấn phục vụ qua `HtmlService` kết hợp với popup `window.open` client-side.
- **"Cấm kỵ" cần tránh:** Tránh làm xáo trộn bố cục chiều dọc khiến phần chữ ký bị đẩy sang trang in mới (bị ngắt trang sai lệch).
- **Ràng buộc kiến trúc liên quan:** Mẫu HTML được nối chuỗi dạng mã hóa kí tự HTML (`_L`, `_G`, `_S`) đặc thù của file `pg_general_3.html` để tránh lỗi parse của Apps Script.

## 4. Giả định và câu hỏi mở

### Giả định
- Các chữ bổ sung sẽ dùng chữ in đậm hoặc in thường có kích thước tiêu chuẩn giống như nhãn chữ ký chính.
- Sử dụng thẻ `br` để phân dòng giữa các nhãn bổ sung và nhãn chữ ký chính.

### Câu hỏi mở
- Không có câu hỏi blocking.

## 5. Acceptance Criteria

- [ ] Khi in bảng chuyển khoản ngân hàng (landscape), góc dưới bên trái phía trên dòng "Cán bộ tiếp nhận" xuất hiện:
  - Dòng 1: **Phần dành cho ngân hàng**
  - Dòng 2: **I/Xác nhận dành cho bộ phận tiếp nhận yêu cầu**
- [ ] Góc dưới bên trái phía trên dòng "Giao dịch viên" xuất hiện:
  - Dòng 1: **II/Phần xác nhận dành cho bộ phận xử lý yêu cầu**
- [ ] Các dòng chữ hiển thị rõ ràng, không bị chèn lấp hoặc phá vỡ cấu trúc bảng chữ ký.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `client/pg_general_3.html` | Sửa | Cập nhật đoạn HTML nối chuỗi tạo bảng chữ ký trong hàm `generateCkHtml` | 🟢 Thấp | Không |

## 7. Risk Triage và Review Focus

- **Review required:** No
- **Risk hotspots:** Khả năng tràn trang/ngắt trang khi thêm chữ dòng mới vào bảng chữ ký.
- **Review focus areas:** Chiều cao của hàng chữ ký và kích thước trang in.
- **Known pitfalls / historical issues:** Việc thêm dòng chữ làm tăng chiều cao của dòng chữ ký, nếu không đủ chỗ trống thì trang in A4 Landscape có thể bị tràn sang trang thứ 2 vô lý. Cần điều chỉnh chiều cao khoảng trống chữ ký `height: 65px` thành nhỏ hơn hoặc bỏ bớt padding nếu cần thiết.
- **Dependencies / rollout concerns:** Không có.

## 8. Chiến lược triển khai

- **Phase strategy:** Triển khai trực tiếp sửa đổi và in test thực tế.
- **Thứ tự triển khai:**
  1. Thay đổi code trong `client/pg_general_3.html`.
  2. Test in thử trên trình duyệt (giả lập print pdf).
  3. Deploy code qua clasp.

## 9. Test Strategy

- **Automated tests:** Không có.
- **Manual verification:**
  - Nhấp nút in bảng kê chuyển khoản ngân hàng (landscape).
  - So sánh trực quan bản in PDF xem đã hiển thị đủ các nhãn như yêu cầu chưa.
  - Kiểm tra xem bố cục in có bị tràn trang hay không.

## 10. Rollback Plan

- Khôi phục file `client/pg_general_3.html` về trạng thái ban đầu bằng Git hoặc backup file.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
