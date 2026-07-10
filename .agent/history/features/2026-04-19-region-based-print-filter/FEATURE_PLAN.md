# Feature Plan: Lọc in theo Khu vực (Hà Nội, Phú Thọ)

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Khuyến nghị gọi `feature-review` trước khi thực thi
> **Feature slug**: region-based-print-filter
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-04-19

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại hệ thống in báo cáo lấy toàn bộ dữ liệu kỳ lương mà không phân biệt khu vực.
- **Vấn đề cần giải quyết:** Người dùng cần tách báo cáo in theo từng khu vực (Hà Nội, Phú Thọ) để phục vụ công tác quản lý và thanh toán riêng biệt.
- **Mục tiêu:** Cung cấp tính năng lọc dữ liệu in theo Khu vực ngay khi người dùng bắt đầu quy trình in.
- **Kết quả mong đợi:** Trang in hiển thị đúng danh sách nhân sự thuộc khu vực đã chọn, dữ liệu được lọc tại backend để đảm bảo hiệu năng và chính xác.

## 2. Phạm vi

### In scope
- Cập nhật UI Modal lương để thêm bước chọn Khu vực.
- Cập nhật API client để truyền tham số khu vực.
- Cập nhật Backend để đọc cột `AM` (Khu vực) từ `DataChotNSThang`.
- Cập nhật logic trả về dữ liệu in (Bảng thuyết minh và Bảng đi ngân hàng) có kèm lọc theo khu vực.

### Out of scope
- Thay đổi logic tính toán số tiền lương.
- Thay đổi template HTML/CSS của trang in.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** Kiến trúc 3 module (client/doGet/doPost). Dữ liệu in được lấy qua `doGet` với tham số `type`.
- **"Cấm kỵ" cần tránh:** Không hardcode dữ liệu khu vực lâu dài nếu có thể, dùng `header.indexOf` để linh hoạt.
- **Ràng buộc kiến trúc liên quan:** Tuân thủ luồng dữ liệu từ `DataChotNSThang` làm source of truth cho thông tin nhân sự theo tháng.

## 4. Giả định và câu hỏi mở

### Giả định
- Cột `AM` trong `DataChotNSThang` luôn chứa giá trị "Hà Nội" hoặc "Phú Thọ".
- "Tất cả" là lựa chọn không thực hiện lọc.

### Câu hỏi mở
- [Non-blocking] Nếu một nhân sự không có khu vực (trống), họ có nên xuất hiện khi chọn "Tất cả" không? (Giả định: Có).

## 5. Acceptance Criteria

- [ ] Người dùng thấy prompt chọn "Khu vực" (Hà Nội, Phú Thọ, Tất cả) khi nhấn nút In.
- [ ] Khi chọn "Hà Nội", bảng đi ngân hàng và thuyết minh chỉ chứa nhân sự Hà Nội.
- [ ] Khi chọn "Phú Thọ", bảng đi ngân hàng và thuyết minh chỉ chứa nhân sự Phú Thọ.
- [ ] Khi chọn "Tất cả", kết quả như cũ.
- [ ] Backend lọc dữ liệu đúng cột AM.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `doGet/doGet_function.js` | Sửa | Cập nhật logic load metadata (`DataChotNSThang`) và lọc dữ liệu in. | 🟡 | Có |
| `doGet/Code.js` | Sửa | Tiếp nhận tham số `region` từ URL request. | 🟢 | Có |
| `client/modal_dataluong_1.js` | Sửa | Truyền thêm tham số `region` vào URL fetch. | 🟢 | Có |
| `client/modal_dataluong_3.html` | Sửa | Thêm UI prompt chọn Khu vực khi click In. | 🟡 | Không rõ |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Vị trí cột `AM` trong `DataChotNSThang`. Cần verify range đọc dữ liệu.
- **Review focus areas:** Logic lọc trong `doGet_getDataPrint_CoThayDoi` và `doGet_getDataPrint_KhongThayDoi`.
- **Known pitfalls / historical issues:** `DataChotNSThang` đôi khi thiếu dữ liệu nếu chưa chốt nhân sự. Cần handle trường hợp `src` null.

## 8. Chiến lược triển khai

- **Phase strategy:** Chia 2 phase: Backend Support và UI Integration.
- **Thứ tự triển khai:**
    1. Cập nhật `doGet` module để hỗ trợ lọc qua parameter.
    2. Cập nhật `client` module để gọi API với parameter mới và hiển thị prompt.
- **Điểm cần phối hợp:** Cần deploy `doGet` trước khi test UI.

## 9. Test Strategy

- **Automated tests:** Không có framework test tự động, manual test qua log và kết quả in.
- **Manual verification:**
    - So sánh số lượng nhân sự Hà Nội trong Sheets với trang in.
    - So sánh số lượng nhân sự Phú Thọ trong Sheets với trang in.
- **Data / env chuẩn bị trước khi test:** Đảm bảo `DataChotNSThang` có đủ dữ liệu cột AM cho kỳ lương test.

## 10. Rollback Plan

- Revert code về version cũ qua Git (hoặc bản backup local).

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
