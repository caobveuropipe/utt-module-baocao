# Feature Plan: Kiểm tra trùng lặp mã hóa đơn khi upload

> **Trạng thái**: ⏳ CHỜ REVIEW
> **Review gate**: Bắt buộc review trước khi thực thi
> **Feature slug**: duplicate-invoice-check
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-04-19

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại, tính năng Upload dữ liệu Excel (`importToDatabase`) chỉ append (thêm) các dòng mới vào `Sheet Data`. Không có kiểm tra tính duy nhất của Mã hóa đơn (Mã HĐ).
- **Vấn đề cần giải quyết:** Nếu kế toán vô tình tải lên cùng một file hoặc tải một file chứa các hóa đơn đã được đẩy lên trước đó, hệ thống sẽ chèn thêm dữ liệu, dẫn đến nhân đôi doanh thu báo cáo.
- **Mục tiêu:** Cài đặt cơ chế kiểm tra trùng lặp dựa trên "Mã HĐ" giữa file upload và database hiện tại (theo năm/tháng). Nếu phát hiện trùng, hệ thống sẽ cảnh báo trên giao diện (UI) và yêu cầu người dùng quyết định: Hủy bỏ hoặc Tiếp tục.
- **Kết quả mong đợi:** Upload an toàn hơn, tránh rủi ro trùng lặp dữ liệu không đáng có. User có toàn quyền quyết định ghi khi phát hiện hóa đơn đã tồn tại.

## 2. Phạm vi

### In scope
- Tìm cột "Mã HĐ" (hoặc "Số hóa đơn") trong dữ liệu file Excel vừa upload.
- Trích xuất danh sách các Mã hóa đơn ở dạng tập hợp duy nhất (unique set).
- So sánh các mã này với danh sách Mã hóa đơn đang có trong `Sheet Data` tương ứng với Năm/Tháng đó.
- Hiển thị popup cảnh báo ở front-end (`client`) cho người dùng biết có file tải lên chứa các mã hóa đơn bị trùng lặp, kèm theo cảnh báo rõ ràng về việc có thể bị nhân đôi dữ liệu nếu tiếp tục.
- Tự động tạo và cho phép người dùng tải xuống một file (Excel/CSV) danh sách các mã hóa đơn trùng lặp.
- Xử lý hành động "Tiếp tục" (chỉ append) hoặc "Cancel" từ user.

### Out of scope
- Kiểm tra chi tiết đến từng mặt hàng (Dịch vụ) trong hóa đơn. Chỉ check trùng theo Mã HĐ.
- Xử lý UI cho các file tải lên loại khác (như danh sách khách hàng, code FS) không liên quan đến Data giao dịch.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** Vẫn xử lý dữ liệu ở `dopost` -> `Service_Import.gs` -> `importToDatabase`.
- **"Cấm kỵ" cần tránh:** Không làm chậm trải nghiệm của User khi upload nếu file lớn. Quá trình kiểm tra bắt buộc phải so khớp tập trung (Array processing), không dùng vòng lặp gọi API nhiều lần.
- **Ràng buộc kiến trúc liên quan:** Proxy pattern giữa `client/Code.gs` và `dopost/doPost.gs` qua `UrlFetchApp` bắt buộc phải được giữ nguyên. Chữ ký HMAC không bắt buộc cho flow upload hiện tại theo logic cũ, nhưng nếu có thể, vẫn giữ nguyên contract API.

## 4. Giả định và câu hỏi mở

### Giả định
- Mã hóa đơn nằm ở một cột có tên `Mã HĐ`, `Số hóa đơn` hoặc `Mã HD` trong cả Data nguồn và Data đích.

### Quyết định từ câu hỏi mở
- **Hành động khi "Tiếp tục":** Chốt phương án là **chỉ Append thêm dòng** giống logic hiện hành. Tuy nhiên, hệ thống sẽ cảnh báo rõ ràng trên UI về việc có thể bị nhân đôi dữ liệu (double dữ liệu) do các mã hóa đơn này đã được upload trước đó.
- **Hiển thị danh sách trùng lặp:** UI không cần hiển thị chi tiết các mã trùng ngay trên popup. Thay vào đó, hệ thống sẽ tự động tạo một file (Excel/CSV) có ghi chú các mã hóa đơn trùng lặp để người dùng có thể tải về kiểm tra chi tiết.

## 5. Acceptance Criteria

- [ ] Khi tải lên một file có chứa Mã HĐ đã tồn tại trong DB, hệ thống dừng upload, không lưu dữ liệu và hiện popup cảnh báo rõ ràng nguy cơ nhân đôi dữ liệu.
- [ ] Popup hiển thị số lượng hóa đơn trùng lặp và cung cấp nút / tự động tải xuống file báo cáo (chứa danh sách mã bị trùng lặp).
- [ ] Bấm "Cancel", tiến trình upload bị dừng, không có dòng nào được thêm.
- [ ] Bấm "Tiếp tục", hệ thống bắt đầu quá trình ghi chèn thêm vào database (append) với param `force: true`.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `dopost/Service_Import.gs` | Sửa | Thêm hàm kiểm tra `duplicate_warning` và thêm logic vào `uploadExcelFile`. | 🟡 | Không đổi |
| `dopost/doPost.gs` | Sửa | Cập nhật luồng tiếp nhận `force` option nếu có thay đổi. | 🟢 | Không đổi |
| `client/scripts.html` | Sửa | Xử lý mã trả về `duplicate_warning` từ API upload. Vẽ popup hỏi user. | 🟢 | Không đổi |
| `client/Code.gs` | Sửa | Bổ sung flag `force` khi upload. | 🟢 | Không đổi |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Hành vi Append trùng hóa đơn có thể gây sai lệch báo cáo doanh thu nếu người dùng ấn "Tiếp tục" sai cách. Do đó cần đảm bảo thông báo cảnh báo cực kỳ dễ hiểu.
- **Review focus areas:** Tính toán tập hợp trùng lặp ở Backend cần tối ưu bộ nhớ. Logic sinh file CSV danh sách lỗi ở Frontend.

## 8. Chiến lược triển khai

- **Phase strategy:** 
  - Phase 1: Thêm logic Duplicate Check tại Backend (`dopost/Service_Import.gs`), trả về `duplicate_warning` và danh sách mảng bị trùng (array) nếu file tải lên bị trùng.
  - Phase 2: Nâng cấp UI/UX Front-end (`client/scripts.html`, `client/Code.gs`). Khi nhận `duplicate_warning`, UI cho phép tải danh sách mã trùng dưới định dạng CSV, hiện cảnh báo rủi ro nhân đôi dữ liệu và hiển thị tùy chọn cho phép "Tiếp tục" (Append) hoặc "Cancel".
  - Phase 3: Bổ sung code cho backend cho luồng "Tiếp tục", chỉ ghi đè tham số `force: true` cho phép append.
- **Thứ tự triển khai:** Phase 1 -> Phase 2 -> Phase 3.

## 9. Test Strategy

- **Manual verification:** 
  - Tạo file A, Upload -> Thành công.
  - Tạo file B (Chứa vài hóa đơn của file A kèm theo hóa đơn mới), Upload -> Hiện Popup cảnh báo.
  - Test nút "Cancel" -> Check DB, không bị sửa.
  - Test nút "Tiếp tục" -> Hành vi được thực thi.

## 10. Rollback Plan

- Revert file `Service_Import.gs` bỏ đoạn check `force` flag. Khôi phục `scripts.html` ở Client. Đi kèm việc đẩy code bằng clasp.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
