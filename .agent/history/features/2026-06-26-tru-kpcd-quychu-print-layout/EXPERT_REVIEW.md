---
source: feature-review
feature: tru-kpcd-quychu-print-layout
round: 1
timestamp: 2026-06-26T12:01:00Z
verdict: ✅ ĐỒNG Ý
---

# Expert Review: tru-kpcd-quychu-print-layout

## Findings

### FR-01: Ngăn chặn ngắt trang lỗi cho phần chữ ký
- **Severity**: Medium
- **Confidence**: High
- **Issue**: Phần chữ ký có nguy cơ bị chia cắt hoặc hiển thị không trọn vẹn ở trang sau nếu bảng danh sách dài sát mép trang.
- **Evidence**: `.sig-container` chưa cấu hình thuộc tính CSS `page-break-inside: avoid;`.
- **Impact**: Có thể khiến tiêu đề chữ ký nằm ở trang 1 còn tên người ký bị đẩy sang trang 2 hoặc ngược lại.
- **Required Fix**: Bổ sung thuộc tính CSS `page-break-inside: avoid;` vào class `.sig-container`.

### FR-02: Cấu hình xuống dòng tự động cho cột Ghi chú
- **Severity**: Low
- **Confidence**: High
- **Issue**: Cột "Ghi chú" không chỉ định width cố định, nếu nội dung ghi chú quá dài có thể kéo dãn bảng in gây vỡ khung lề phải.
- **Evidence**: `<th>Ghi chú</th>` không được set style width cụ thể hay word-break.
- **Impact**: Nếu dòng ghi chú dài, bảng vẫn có thể bị tràn lề phải.
- **Required Fix**: Thêm style `word-break: break-word;` hoặc đặt width tương đối cho cột Ghi chú.

## Khuyến nghị không chặn rollout
- Không có.

## Cần xác thực thêm
- Không có.
