---
source: feature-review
feature: phan-bo-luong-bhxh-html-print-view
round: 1
timestamp: 2026-08-18T15:48:00+07:00
verdict: ✅ ĐỒNG Ý
---

# Expert Review: phan-bo-luong-bhxh-html-print-view

## Findings

### FR-01: Cách ly thuộc tính `min-width` của bảng trên màn hình để không ảnh hưởng đến bản in `@media print`
- **Severity**: Low
- **Confidence**: High
- **Issue**: Khi đặt `min-width: ~1350px` cho `.phanbo-table` để chống co chữ trên màn hình, nếu không reset trong `@media print`, bản in thực tế có thể bị ép tràn chiều ngang ra ngoài lề giấy in.
- **Evidence**: Trong `client/pg_general_3.html`, `@media print` áp dụng `zoom: 76%` và `.page-container { width: 100%; }`. Nếu class `.phanbo-table` mang `min-width` cố định trên global CSS mà không có `@media screen` scope hoặc không được reset `min-width: 100% / auto` trong `@media print`, trang in có thể bị lệch lề.
- **Impact**: Có thể phát sinh sai lệch nhỏ ngoài ý muốn khi in ra giấy nếu không bao bọc scope cẩn thận.
- **Required Fix**: Định nghĩa `min-width` của bảng và cột trong phạm vi màn hình hoặc ghi đè rõ ràng `@media print { .phanbo-table { min-width: unset !important; width: 100% !important; } }`.

### FR-02: Đảm bảo độ rộng cột STT và Nội dung độc lập với các báo cáo Generic khác
- **Severity**: Low
- **Confidence**: High
- **Issue**: Hàm `generateGenericReportHtml` được dùng chung cho nhiều loại báo cáo (Hạch toán BHXH, Hạch toán KPCĐ, Phân bổ lương).
- **Evidence**: `client/pg_general_3.html` phân nhánh `colgroup` theo `data[0].length === 23` và `title.includes("PHÂN BỔ")`.
- **Impact**: Nếu sửa nhầm ra ngoài nhánh `isPhanBo23`, các báo cáo khác có thể bị xê dịch cột.
- **Required Fix**: Kiểm tra kỹ điều kiện `isPhanBo23` / `title.toUpperCase().includes("PHÂN BỔ")` khi gán class và render `colgroup`.

## Khuyến nghị không chặn rollout
- Kiểm tra hiển thị thực tế trên các độ phân giải màn hình phổ biến (1366x768, 1920x1080) để đảm bảo thanh cuộn ngang xuất hiện mượt mà khi cửa sổ trình duyệt hẹp.

## Cần xác thực thêm
- Không có.
