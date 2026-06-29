# Feature Plan: Hướng dẫn sử dụng (User Guide Tab)

> **Trạng thái**: ⏳ CHỜ REVIEW
> **Review gate**: Khuyến nghị gọi `feature-review` để duyệt nội dung hướng dẫn và UI
> **Feature slug**: user-guide-tab
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-04-19

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Dự án Clinic Revenue Management có luồng dữ liệu phức tạp từ Excel vào Google Sheets thông qua thuật toán phân bổ. Người dùng (Kế toán/Admin) cần hiểu rõ thứ tự các bước để tránh lỗi dữ liệu.
- **Vấn đề cần giải quyết:** Hiện chưa có tài liệu hướng dẫn trực tiếp trên Giao diện. Người dùng có thể quên cập nhật Danh mục trước khi upload, dẫn đến dữ liệu report bị thiếu (N/A).
- **Mục tiêu:** Tạo một tab "Hướng dẫn" chuyên nghiệp, trình bày trực quan các luồng dữ liệu và các điều kiện tiên quyết (prerequisites).
- **Kết quả mong đợi:** Một tab mới trong Sidebar, nội dung hiển thị các bước từ chuẩn bị danh mục -> chuẩn bị file Excel -> Upload -> Xem báo cáo.

## 2. Phạm vi

### In scope
- Thêm icon/tab "Hướng dẫn" vào Sidebar.
- Tạo view `view-user-guide` trong `index.html`.
- Viết nội dung hướng dẫn chi tiết (Markdown-like style hoặc dùng HTML components).
- Tích hợp logic chuyển tab trong `scripts.html`.

### Out of scope
- Tạo video hướng dẫn (chỉ dùng text và icon).
- Tải file PDF hướng dẫn (vòng sau nếu cần).

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** Tôn trọng Tech Stack hiện tại (Vanilla HTML/CSS/JS).
- **"Cấm kỵ" cần tránh:** Không làm thay đổi logic backend hay structure của Sheets.
- **Ràng buộc kiến trúc liên quan:** Phải đồng bộ với menu phân quyền (chỉ hiển thị nếu cần, hoặc mặc định cho mọi người xem).

## 4. Giả định và câu hỏi mở

### Giả định
- Tab "Hướng dẫn" sẽ hiển thị cho tất cả các Role (Admin, Leader, Staff, Guest) để mọi người hiểu hệ thống.
- Sử dụng các tab phụ bên trong trang Hướng dẫn để chia nhỏ nội dung.

### Câu hỏi mở
- [Non-blocking] User có muốn đính kèm các file Excel mẫu trực tiếp trên trang này không? (Tạm thời mô tả bằng text cột).

## 5. Acceptance Criteria

- [ ] Tab "Hướng dẫn" xuất hiện ở Sidebar, icon `fa-book` hoặc `fa-info-circle`.
- [ ] Khi click, UI chuyển sang view Hướng dẫn mà không lag.
- [ ] Nội dung bao gồm ít nhất 4 phần: 
    1. Thiết lập danh mục (Bắt buộc).
    2. Chuẩn bị file Excel (Headers).
    3. Quy trình Upload & Kiểm trùng.
    4. Cách đọc Báo cáo.
- [ ] Thiết kế Premium (Gradients, Icons, Stepper UI).

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `client/index.html` | Sửa | Thêm Menu Item và View Content | 🟢 | Không |
| `client/scripts.html` | Sửa | Thêm logic chuyển tab và sync title | 🟢 | Không |
| `client/styles.html` | Sửa | Thêm style cho trang hướng dẫn (Steppers, Cards) | 🟢 | Không |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Không có rủi ro về logic, chủ yếu là rủi ro về UX/UI và tính chính xác của nội dung hướng dẫn.
- **Review focus areas:** Kiểm tra xem các mô tả về "Mã hóa đơn", "Tên DV-SP" có khớp với logic code hiện tại hay không.

## 8. Chiến lược triển khai

- **Phase strategy:** Một phase duy nhất vì đây là feature UI thuần túy.
- **Thứ tự triển khai:**
    1. Cập nhật `styles.html` với CSS cho hướng dẫn.
    2. Cập nhật `index.html` thêm Sidebar link và View.
    3. Cập nhật `scripts.html` để handle navigation.
- **Yêu cầu migration / config / deploy:** Cần deploy lại project `client` sau khi hoàn tất.

## 9. Test Strategy

- **Manual verification:**
    - Click tab Hướng dẫn có ra đúng nội dung không.
    - Sidebar có highlight đúng khi đang ở tab Hướng dẫn không.
    - Các bước hướng dẫn có dễ hiểu và đúng logic app không.

## 10. Rollback Plan

- Revert commit của file `client/index.html`, `client/scripts.html`, `client/styles.html`.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
