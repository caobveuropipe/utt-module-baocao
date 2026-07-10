# Feature Plan: Điều chỉnh bản in trừ KPCĐ và các quỹ

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Đã qua cổng review
> **Feature slug**: tru-kpcd-quychu-print-layout
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-06-26

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Bảng in trừ KPCĐ và các quỹ ("DANH SÁCH TRỪ KP CÔNG ĐOÀN VÀ CÁC QUỸ") hiện tại đang gặp lỗi tràn lề phải khiến một phần nội dung bị cắt mất khi in ra giấy hoặc xuất PDF. Đồng thời, phần chữ ký bên dưới chỉ có một chữ ký "Người lập", trong khi thực tế yêu cầu 3 chữ ký.
- **Vấn đề cần giải quyết:** 
  1. Kích thước các cột và cỡ chữ trong bảng in quá lớn, gây mất nội dung lề phải khi in A4 dọc.
  2. Phần chữ ký hiện chỉ có "Người lập" đơn lẻ, cần được thay thế bằng 3 chữ ký: "Kế toán lương", "Kế toán trưởng", và "Thủ trưởng đơn vị" (TS. Nguyễn Văn Lâm).
- **Mục tiêu:** 
  1. Điều chỉnh CSS/HTML để bảng vừa vặn trang giấy A4 dọc.
  2. Cập nhật phần chữ ký đúng định dạng yêu cầu từ hình ảnh tham chiếu (3 chữ ký hàng ngang).
- **Kết quả mong đợi:** 
  1. Bản in "DANH SÁCH TRỪ KP CÔNG ĐOÀN VÀ CÁC QUỸ" hiển thị trọn vẹn, không bị mất lề phải.
  2. Phần chữ ký ở cuối trang hiển thị đầy đủ 3 chức danh: Kế toán lương, Kế toán trưởng, và Thủ trưởng đơn vị (TS. Nguyễn Văn Lâm).

## 2. Phạm vi

### In scope
- Chỉnh sửa HTML/CSS trong hàm `generateTruKPCDHtml` thuộc file [pg_general_3.html](file:///d:/Project/UoTT/Dikhobac/client/pg_general_3.html).
- Giảm width các cột và giảm `font-size` của bảng (`th, td`).
- Thiết lập lại bảng chữ ký với cấu trúc 3 cột cho 3 chức danh ký tên.

### Out of scope
- Sửa đổi các dữ liệu tính toán từ backend hoặc các báo cáo khác không liên quan đến bảng trừ KPCĐ và quỹ.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** Tôn trọng cấu trúc generate HTML và in trực tiếp từ cửa sổ `window.open` client-side.
- **"Cấm kỵ" cần tránh:** Không phá vỡ cấu trúc CSS chung của `page-container`.
- **Ràng buộc kiến trúc liên quan:** Bản in sử dụng font `Times New Roman` và kích thước chuẩn A4 dọc (`210mm` width).

## 4. Giả định và câu hỏi mở

### Giả định
- Vị trí dateExport (`res.dateExport`) sẽ nằm phía trên chức danh "Thủ trưởng đơn vị" (bên phải ngoài cùng), các chức danh còn lại "Kế toán lương" và "Kế toán trưởng" chỉ có tên chức danh và khoảng trống ký tên.

### Câu hỏi mở
- Không có câu hỏi blocking.

## 5. Acceptance Criteria

- [ ] Khi chọn in bảng trừ KPCĐ và các quỹ, bảng hiển thị trọn vẹn trong trang A4 dọc, không bị cuộn ngang hoặc mất lề phải.
- [ ] Cỡ chữ cột dữ liệu vừa mắt, dễ đọc nhưng không bị tràn dòng xuống dòng quá nhiều.
- [ ] Phần chữ ký hiển thị 3 cột rõ ràng: Kế toán lương (trái), Kế toán trưởng (giữa), Thủ trưởng đơn vị TS. Nguyễn Văn Lâm (phải) kèm ngày tháng năm xuất.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| [pg_general_3.html](file:///d:/Project/UoTT/Dikhobac/client/pg_general_3.html) | Sửa | Điều chỉnh CSS độ rộng cột, font-size và thay thế HTML phần chữ ký trong hàm `generateTruKPCDHtml` | 🟢 Thấp | Không |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Đảm bảo responsive/in A4 của CSS `@media print` hoạt động chính xác trên các trình duyệt.
- **Review focus areas:** Kiểm tra việc chia tỷ lệ % độ rộng cột chữ ký đảm bảo hiển thị thẳng hàng và không bị đẩy xuống trang thứ 2 nếu bảng dài sát đáy.
- **Known pitfalls / historical issues:** Chú ý việc chèn ngắt trang (`page-break-inside: avoid`) cho phần chữ ký nếu cần để tránh chữ ký bị cắt đôi.

## 8. Chiến lược triển khai

- **Phase strategy:** 
  - Phase 1: Chỉnh sửa CSS, độ rộng cột của bảng in và cấu trúc 3 chữ ký trong [pg_general_3.html](file:///d:/Project/UoTT/Dikhobac/client/pg_general_3.html).
  - Phase 2: Xác thực hiển thị thực tế (bản in PDF) và nghiệm thu.
- **Thứ tự triển khai:** Frontend CSS/HTML -> Test print layout.

## 9. Test Strategy

- **Manual verification:**
  - Mở trang quản trị chính, chọn xuất "Trừ KPCĐ và Các quỹ".
  - Kiểm tra bản in hiển thị trên tab mới: lề phải có bị mất không.
  - Kiểm tra 3 chữ ký hiển thị đúng vị trí và nội dung.
  - Sử dụng tính năng "Print to PDF" để kiểm tra kết quả in giả lập.

## 10. Rollback Plan

- Khôi phục file [pg_general_3.html](file:///d:/Project/UoTT/Dikhobac/client/pg_general_3.html) về bản backup gần nhất hoặc sử dụng Git/Clasp history.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
