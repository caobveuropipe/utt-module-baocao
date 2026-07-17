# Feature Plan: Sửa lỗi hiển thị header Bảng phân bổ tiền lương và BHXH

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Đã duyệt qua feature-review
> **Feature slug**: fix-salary-insurance-headers
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-07-17

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Báo cáo "Bảng phân bổ tiền lương và bảo hiểm xã hội" khi xuất ra có cấu trúc header bị sai lệch (Hình 1) so với yêu cầu chuẩn (Hình 2 và Hình 3).
- **Vấn đề cần giải quyết:**
  1. **Lệch dòng header (Row Misalignment):** Các dòng tiêu đề nhóm, tiêu đề cột, số thứ tự cột và công thức bị dồn dịch lên 1 dòng so với thiết kế chuẩn. Dòng công thức ghi đè vào dòng số thứ tự cột, dẫn tới số cột 9 bị định dạng nhầm thành số thập phân `9.000` (ở cột Trách nhiệm). Dữ liệu bị ghi đè lên dòng công thức.
  2. **Merge sai cột nhóm "Các khoản phải nộp theo lương":** Thay vì chỉ merge từ cột 11 đến cột 14 (BHXH, BHYT, BHTN, Kinh phí công đoàn), header nhóm này lại merge tràn sang tận cột 18 (bao phủ cả "Các khoản giảm trừ" và "Trừ khác").
  3. **Thừa cột V:** Bảng có thêm một cột trống không cần thiết ở phía bên phải (Cột V), làm vỡ khung viền in ấn.
- **Mục tiêu:**
  - Khôi phục đúng cấu trúc header 4 tầng chuẩn:
    - **Dòng 6:** Tiêu đề nhóm lớn ("Hệ số" [C6:I6], "Các khoản phải nộp theo lương" [K6:N6], "Các khoản giảm trừ" [O6:P6], "Trừ khác" [Q6:R6]).
    - **Dòng 7:** Tiêu đề cột chi tiết ("Lương ngạch bậc", ..., "ĐH", "TN", "BHXH", ..., "N/ngoài", "Nghỉ BHXH", "Tạm ứng tạm giữ", "Quỹ XH").
    - **Dòng 8:** Số thứ tự cột từ 1 đến 21 (định dạng văn bản dạng `@`).
    - **Dòng 9:** Công thức diễn giải cột (cột 10 đến 21).
  - Dữ liệu bắt đầu ghi từ **Dòng 10** (thay vì Dòng 11).
  - Khắc phục triệt để lỗi merge tràn và thừa cột V.
- **Kết quả mong đợi:** Xuất file Excel/PDF đúng y hệt định dạng của Hình 2 và Hình 3.

## 2. Phạm vi

### In scope
- Sửa đổi file logic server-side: [doGet_phanBoLuongBHXH.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_phanBoLuongBHXH.js).
- Thiết lập lại cơ chế merge/unmerge động cho dòng 7 (dòng nhóm tiêu đề) để triệt tiêu lỗi merge tràn từ template.
- Định vị lại các dòng ghi số thứ tự cột (Dòng 9), dòng công thức (Dòng 10), và điểm bắt đầu ghi dữ liệu (Dòng 11).
- Cập nhật định dạng viền (borders), font chữ, độ rộng cột của các dòng này.

### Out of scope
- Thay đổi cấu trúc dữ liệu tính toán bên dưới (các phép tính số học, tỷ lệ bảo hiểm giữ nguyên).
- Thay đổi các module báo cáo khác.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** Giữ nguyên cơ chế chèn cột động "Độc hại" (ĐH) và "Trách nhiệm" (TN) nếu phát hiện cột gộp "ĐH + TN".
- **"Cấm kỵ" cần tránh:** Không làm thay đổi cấu trúc mảng đầu ra (`result`) dẫn tới sai lệch logic đối chiếu lương.

## 4. Giả định và câu hỏi mở

### Giả định
- Template gốc trên Drive (file `1FZ1t_RszFsr8urWnD7hNc0KlKv_oXLWQn_2eoavU5LY`) có thể đang bị merge sai hoặc dồn dịch. Do đó, việc can thiệp code để **unmerge & re-merge đúng bằng chương trình** là phương án an toàn nhất để tránh phụ thuộc vào sự thay đổi thủ công trên Drive.

### Câu hỏi mở
- Không có câu hỏi blocking.

## 5. Acceptance Criteria

- [ ] Số thứ tự cột 1-21 hiển thị đúng trên Dòng 8 (cột 9 hiển thị "9" dạng text, không phải "9.000").
- [ ] Các công thức diễn giải ("10 = ...", "21 = 10 - 19") hiển thị đúng trên Dòng 9.
- [ ] Dữ liệu lương của các đơn vị bắt đầu từ Dòng 10.
- [ ] Header nhóm "Các khoản phải nộp theo lương" chỉ merge từ cột K đến cột N (cột 11 đến 14) trên Dòng 6.
- [ ] Header "Các khoản giảm trừ" và "Trừ khác" là các ô merge riêng biệt trên Dòng 6 (O6:P6 và Q6:R6).
- [ ] Không xuất hiện cột V trống ở phía ngoài cùng bên phải bảng tính.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| [doGet_phanBoLuongBHXH.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_phanBoLuongBHXH.js) | Sửa | Chứa logic vẽ header, ghi đè công thức và ghi dữ liệu | 🟢 Thấp | Không |

<!-- Sửa theo EFR-01: Di chuyển số thứ tự lên dòng 8, công thức xuống dòng 9, dữ liệu bắt đầu ghi từ dòng 10 để không bị đè và định dạng sai -->
<!-- Sửa theo EFR-02: Hủy merge dòng 6 và re-merge chuẩn bằng code động để không bị merge tràn -->

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Việc hủy merge và re-merge có thể gây lỗi `"You must select all cells in a merged range"` nếu không dọn dẹp (breakApart) đúng phạm vi ô merge cũ.
- **Review focus areas:** Đảm bảo các hàm `breakApart()` bao phủ toàn bộ vùng header cũ dòng 6 và 7 trước khi thực hiện merge mới.

## 8. Chiến lược triển khai

- **Phase strategy:** Sửa đổi file doGet, chạy thử nghiệm trên môi trường kiểm thử/local, sau đó đồng bộ lên Apps Script.
- **Thứ tự triển khai:**
  1. Hủy merge cũ dòng 6 (A6:U6 hoặc rộng hơn) và thực hiện merge chuẩn:
     - Hệ số: C6:I6 (cột 3-9)
     - Các khoản phải nộp theo lương: K6:N6 (cột 11-14)
     - Các khoản giảm trừ: O6:P6 (cột 15-16)
     - Trừ khác: Q6:R6 (cột 17-18)
  2. Ghi số thứ tự cột vào Dòng 8 (1 đến 21).
  3. Ghi công thức vào Dòng 9.
  4. Đẩy dòng ghi dữ liệu xuống Dòng 10.
  5. Cập nhật viền bảng (Borders) cho phù hợp với 4 dòng header (6, 7, 8, 9) + data.

## 9. Test Strategy

- **Manual verification:** Xuất file Excel/PDF từ giao diện và so sánh trực quan với Hình 2 & 3.

## 10. Rollback Plan

- Khôi phục file backup được tạo tự động khi push bằng `.\push-all.ps1`.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
