---
source: feature-review
feature: danh-sach-treo-luong
round: 1
timestamp: 2026-08-20T15:45:00+07:00
verdict: ✅ ĐỒNG Ý
---

# Expert Review: danh-sach-treo-luong

## Findings

### FR-01: Tái sử dụng `generateCkHtml` và `getPrintDataCk` qua tham số cờ thay vì nhân bản hàm
- **Severity**: Low
- **Confidence**: High
- **Issue**: Kế hoạch đề xuất tạo thêm hàm riêng `getPrintDataTreoLuong` hoặc truyền cờ `isTreoLuong`. Nếu nhân bản mã logic tính toán hoặc sinh HTML sẽ gây trùng lặp code và khó bảo trì.
- **Evidence**: `doGet_tongHopDiNganHang`, `getPrintDataCk` và `generateCkHtml` đều có thể nhận thêm tùy chọn `isTreoLuong: boolean` (hoặc `reportType`) để tái sử dụng toàn bộ 100% logic tính toán, định dạng số, CSS và footer.
- **Impact**: Tối ưu bảo trì mã nguồn, không làm phân mảnh logic hạch toán chuyển khoản.
- **Required Fix**: Triển khai theo hướng thêm tham số tùy chọn (mặc định `isTreoLuong = false`) cho các hàm backend và frontend, đảm bảo backward compatibility tuyệt đối.

## Khuyến nghị không chặn rollout
- Modal popup chọn loại in ở Phú Thọ: nên dùng Bootstrap Modal có sẵn trong template (`pg_general_3.html`) để đồng bộ UI/UX hiện có.
- Chuẩn hóa chuỗi trạng thái bằng `.normalize('NFC').trim().toLowerCase()` để bắt trọn cả `đi công tác nn` và `đi nn`.

## Cần xác thực thêm
- Không có
