# Feature Plan: Cải thiện hiển thị màn hình HTML Bảng phân bổ tiền lương và BHXH

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Đã thông qua hội đồng review kỹ thuật
> **Feature slug**: `phan-bo-luong-bhxh-html-print-view`
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-08-18 (Đã review & duyệt)

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Khi mở màn hình HTML xem bảng "Bảng phân bổ tiền lương và bảo hiểm xã hội" (23 cột), bảng bị co hẹp ngang quá mức trên giao diện xem, làm các tiêu đề và nội dung bị ngắt chữ rớt dòng từng ký tự theo chiều dọc (`N-ộ-i-d-u-n-g`, `T-ạ-m-ứ-n-g`, `B-ộ-p-h-ậ-n-q-u-ả-n-l-ý`, `V-ư-ợ-t-k-h-u-n-g`).
- **Yêu cầu cốt lõi từ User:**
  - **Màn hình hiển thị HTML:** Tỷ lệ các cột hiển thị đầy đủ, rõ ràng, căn chỉnh kích thước tối thiểu (min-width / colgroup) để không bị wrap text quá mức như hiện tại (hỗ trợ cuộn ngang tự nhiên trên container nếu màn hình nhỏ).
  - **Bản in thực tế (Print Preview / `@media print`):** Giữ nguyên toàn bộ cấu hình in ấn hiện tại, **không thay đổi gì** ở phần in.
- **Mục tiêu:** Tinh chỉnh CSS hiển thị trên màn hình (`@media screen`) của Bảng phân bổ tiền lương và BHXH trong `client/pg_general_3.html` để:
  1. Các cột có kích thước tối thiểu hợp lý, text không bị bẻ vụn thành từng ký tự dọc.
  2. Bảng hiển thị đầy đủ, ngay ngắn, dễ đọc trên giao diện HTML với thanh cuộn ngang mượt mà khi cần.
  3. Tuyệt đối bảo toàn nguyên vẹn bản in (`@media print`).

## 2. Phạm vi

### In scope
- Cập nhật CSS hiển thị màn hình cho bảng 23 cột (`.phanbo-table`) và container trong `client/pg_general_3.html`:
  - Đặt `min-width` tổng thể phù hợp cho bảng 23 cột trên màn hình (đảm bảo đủ không gian cho 23 cột).
  - Cấu hình kích thước tối thiểu từng cột trong `colgroup` (STT, Nội dung, các cột Hệ số, các cột Tiền,...) để chữ hiển thị trọn vẹn, không ngắt vụn từng chữ cái.
  - Thiết lập `white-space: nowrap` cho các ô số liệu, và `word-break: normal; white-space: normal;` với độ rộng đủ cho các ô chữ/tiêu đề.
  - Cho phép container (`.page-container`) cuộn ngang (`overflow-x: auto`) mượt mà trên màn hình khi xem.
- Đảm bảo các quy tắc CSS chỉnh sửa chỉ áp dụng trên màn hình (Screen View) hoặc scoped riêng cho bảng phân bổ, không đụng chạm đến `@media print` và các báo cáo khác.

### Out of scope
- **Tuyệt đối KHÔNG thay đổi** cấu hình `@media print`, `@page`, zoom in ấn hoặc định dạng của bản in khi bấm `window.print()`.
- Không thay đổi logic tính toán số liệu backend (`doGet/doGet_phanBoLuongBHXH.js`).
- Không sửa đổi cấu trúc dữ liệu JSON API.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - Giữ nguyên kiến trúc client/doGet và luồng sinh HTML popup từ `generateGenericReportHtml`.
- **"Cấm kỵ" cần tránh:**
  - Không sửa đổi quy tắc `@media print` đã được cấu hình ổn định cho máy in.
  - Không làm ảnh hưởng đến các báo cáo generic khác dùng chung hàm (Hạch toán BHXH, Hạch toán KPCĐ).

## 4. Giả định và câu hỏi mở

### Giả định
- Trên màn hình hiển thị HTML, bảng 23 cột cần bề rộng tối thiểu khoảng `1300px - 1400px` để tất cả 23 tiêu đề (đặc biệt là công thức và tên bộ phận) hiển thị rõ ràng, không bị ngắt chữ xấu. Container sẽ tự động bật thanh cuộn ngang khi cửa sổ trình duyệt nhỏ hơn độ rộng này.
- Khi người dùng bấm nút in, trình duyệt sẽ tự động áp dụng `@media print` sẵn có như hiện tại.

### Câu hỏi mở
- Không có câu hỏi blocking.

## 5. Acceptance Criteria

- [ ] Cột "Nội dung", "Vượt khung", "Tạm ứng", "Bộ phận quản lý" trên màn hình HTML hiển thị rõ ràng, chữ nằm ngang tự nhiên, không bị rớt từng ký tự xuống dòng.
- [ ] Bảng 23 cột trên màn hình có kích thước tối thiểu chuẩn, các cột hiển thị đầy đủ tỉ lệ và có thể cuộn ngang mượt mà khi màn hình hẹp.
- [ ] Khi bấm nút "IN BÁO CÁO" hoặc `Ctrl + P`, giao diện in (Print Preview của trình duyệt) hoàn toàn giữ nguyên như trước, không bị xáo trộn.
- [ ] Các báo cáo in khác (Hạch toán BHXH, Hạch toán KPCĐ, v.v.) hoạt động bình thường, không bị ảnh hưởng.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `client/pg_general_3.html` | Sửa | Tinh chỉnh CSS màn hình và colgroup min-width cho `.phanbo-table` trong `generateGenericReportHtml` | 🟢 Thấp | Giữ nguyên `@media print` |

## 7. Risk Triage và Review Focus

- **Review required:** No (thay đổi CSS hiển thị màn hình thuần túy, rủi ro thấp).
- **Risk hotspots:** Đảm bảo tách bạch rõ ràng giữa CSS màn hình và `@media print`.
- **Review focus areas:** Kiểm tra độ rộng tối thiểu của cột "Nội dung" (đủ chỗ cho chuỗi "Bộ phận quản lý", "Bộ phận trực tiếp...") và các cột tiêu đề hẹp.

## 8. Chiến lược triển khai

- **Phase duy nhất (Đơn giản & Trực tiếp):**
  - **Task 1:** Điều chỉnh `colgroup` và CSS `.phanbo-table` trong `client/pg_general_3.html` (đặt `min-width` cho bảng ~1350px, cấu hình `min-width` và padding cho từng cột 1..23, chống ngắt chữ ký tự).
  - **Task 2:** Đảm bảo `.page-container` có `overflow-x: auto` trên màn hình và giữ nguyên 100% block `@media print`.
  - **Task 3:** 🧪 Test & Verify: Kiểm tra hiển thị màn hình HTML và xác nhận hộp thoại In (`window.print()`) không đổi.

## 9. Test Strategy

- **Manual verification:**
  1. Mở popup HTML Bảng phân bổ tiền lương và BHXH.
  2. Quan sát trên màn hình: Chữ "Nội dung", "Vượt khung", "Tạm ứng", "Bộ phận quản lý" hiển thị ngang đẹp mắt, không bị rớt chữ đơn lẻ.
  3. Thu nhỏ cửa sổ trình duyệt: Bảng có thanh cuộn ngang, các cột không bị co rúm.
  4. Bấm In: Kiểm tra cửa sổ Print Preview của trình duyệt hoạt động bình thường như ban đầu.

## 10. Rollback Plan

- Khôi phục lại phiên bản `client/pg_general_3.html` nếu cần.
