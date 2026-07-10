# Feature Plan: Tối ưu lề và tăng kích thước chữ trang in Chức năng hạch toán

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Đã review — Có thể handoff sang `feature-coordinator`
> **Feature slug**: adjust-hachtoan-print-margins
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-07-10

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Khi người dùng xuất các báo cáo hạch toán (bảo hiểm, kinh phí công đoàn, lương & truy lĩnh, phân bổ lương và BHXH), các trang in PDF có cỡ chữ khá nhỏ và khoảng lề mặc định của Google Sheets khá rộng làm giảm không gian hiển thị thông tin.
- **Vấn đề cần giải quyết:** Tăng kích thước chữ hiển thị trên bản in PDF bằng cách giảm độ rộng của các lề (top, bottom, left, right) và kết hợp tăng cỡ chữ gốc (font size) của dữ liệu trong bảng tính trước khi xuất.
- **Mục tiêu:** Cải thiện độ rõ nét và dễ đọc của các bản in/xuất PDF cho cả 4 báo cáo hạch toán.
- **Kết quả mong đợi:** 
  - Thêm các cấu hình lề trên URL xuất PDF (`left_margin=0.5` — lề trái rộng hơn để chừa chỗ đóng quyển, `right_margin=0.25`, `top_margin=0.25`, `bottom_margin=0.25`).
  * Thực hiện tăng cỡ chữ chung từ font mặc định (hoặc size nhỏ hơn) lên size lớn hơn (ví dụ: `11` hoặc `12`) tại phần tạo bảng dữ liệu.
  * Đảm bảo phần chữ ký (copy từ `Master`) được điều chỉnh/kế thừa phù hợp mà không bị vỡ bố cục.

## 2. Phạm vi

### In scope
- Cấu hình lại các tham số xuất PDF (`left_margin=0.5`, `right_margin=0.25`, `top_margin=0.25`, `bottom_margin=0.25`) trên tất cả các hàm xuất báo cáo thuộc nhóm Hạch toán:
  - `taoBangHachToanBaoHiem` tại [doGet_hachToanBaoHiem.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_hachToanBaoHiem.js)
  - `taoBangHachToanKPCD` tại [doGet_hachToanKPCD.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_hachToanKPCD.js)
  - `taoBangHachToanLuongVaTruyLinh` tại [doGet_hachToanLuongVaTruyLinh.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_hachToanLuongVaTruyLinh.js)
  - `taoBangPhanBoLuongBHXH` tại [doGet_phanBoLuongBHXH.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_phanBoLuongBHXH.js)
- Thêm cấu hình cỡ chữ (`setFontSize(11)` hoặc `setFontSize(12)`) cho vùng dữ liệu chính của các bảng hạch toán này trong code Apps Script.
- Kiểm tra kế thừa định dạng chữ ký từ sheet `Master`.

### Out of scope
- Thay đổi cấu trúc dữ liệu hoặc thuật toán tính toán số liệu hạch toán.
- Các module khác ngoài nhóm hạch toán (như Đi Kho Bạc, Thuyết Minh L1/L2) trừ khi có yêu cầu thêm.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** Giữ nguyên cấu trúc logic gom/lọc theo khu vực/địa phương và cấu trúc bảng hạch toán chuẩn.
- **"Cấm kỵ" cần tránh:** Tránh hardcode các tham số làm lệch bố cục bảng biểu, không auto-resize cột nếu đã có quy định bỏ (`sheet.autoResizeColumns` đã bị comment/bỏ ở một số file).
- **Ràng buộc kiến trúc liên quan:** Định dạng xuất PDF của Google Sheets qua link query string cần được giữ đúng cấu trúc tham số để tránh lỗi xuất tập tin.

## 4. Giả định và câu hỏi mở

### Giả định
- Cỡ chữ của dữ liệu chính trong bảng sẽ điều chỉnh về `10.5pt`, dòng tiêu đề (title) tăng size lên `12pt`, dòng đầu cột (header) size `11pt`, và đổi font chữ sang **Arial** để hiển thị sắc nét, rõ ràng hơn trên bản in PDF.

### Câu hỏi mở
- Không có câu hỏi blocking nào.

## 5. Acceptance Criteria

- [ ] Tất cả 4 file xuất hạch toán đều sử dụng URL xuất PDF có cấu hình giảm lề `0.25` inch.
- [ ] Vùng dữ liệu chính trong các báo cáo hạch toán được set cỡ chữ tối thiểu là 11pt.
- [ ] Bố cục bảng (border nét liền/nét đứt, chữ ký ở cuối) không bị lỗi định dạng hay tràn dòng bất thường.
- [ ] Các tệp PDF xuất ra hiển thị thông tin to, rõ ràng hơn bản cũ khi in trên khổ A4 ngang/dọc tương ứng.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `doGet/doGet_hachToanBaoHiem.js` | Sửa | Cập nhật cỡ chữ dữ liệu và điều chỉnh URL xuất PDF | 🟢 | Không |
| `doGet/doGet_hachToanKPCD.js` | Sửa | Cập nhật cỡ chữ dữ liệu và điều chỉnh URL xuất PDF | 🟢 | Không |
| `doGet/doGet_hachToanLuongVaTruyLinh.js` | Sửa | Cập nhật cỡ chữ dữ liệu và điều chỉnh URL xuất PDF | 🟢 | Không |
| `doGet/doGet_phanBoLuongBHXH.js` | Sửa | Cập nhật cỡ chữ dữ liệu và điều chỉnh URL xuất PDF | 🟢 | Không |

## 7. Risk Triage và Review Focus

- **Review required:** No (User có thể review trực tiếp/bỏ qua vì chỉ tinh chỉnh giao diện in)
- **Risk hotspots:** Định dạng URL của Google Sheets PDF export (`&left_margin=0.5&right_margin=0.25&top_margin=0.25&bottom_margin=0.25`).
- **Review focus areas:** Đảm bảo các tham số URL không bị viết sai chính tả dẫn đến lỗi tải tập tin.
- **Known pitfalls / historical issues:** Một số cột dữ liệu có thể bị quấn dòng (wrap text) nếu kích thước chữ tăng quá lớn mà độ rộng cột không đổi.
- **Dependencies / rollout concerns:** Chỉ cần deploy lại mã doGet sau khi sửa đổi.

## 8. Chiến lược triển khai

- **Phase strategy:** 
  - Phase 1: Tinh chỉnh lề in trên URL và cỡ chữ trong code cho 4 module hạch toán.
  - Phase 2: Kiểm tra định dạng xuất file trên môi trường thực tế (Google Sheets).
- **Thứ tự triển khai:** `doGet_hachToanBaoHiem.js` -> `doGet_hachToanKPCD.js` -> `doGet_hachToanLuongVaTruyLinh.js` -> `doGet_phanBoLuongBHXH.js`.
- **Yêu cầu migration / config / deploy:** Cần chạy lệnh `.\push-all.ps1` để cập nhật code lên Google Apps Script.

## 9. Test Strategy

- **Manual verification:**
  - Thực hiện xuất PDF thử nghiệm cho cả 4 báo cáo hạch toán trên giao diện quản trị Web.
  - So sánh kích thước hiển thị của bản in mới so với bản in cũ để đảm bảo lề đã hẹp lại và chữ to hơn.

## 10. Rollback Plan

- Sử dụng Git để revert lại các thay đổi của 4 file trên nếu xảy ra lỗi vỡ layout hoặc tải PDF lỗi.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
