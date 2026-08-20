---
source: feature-review
feature: fix-print-table-overflow-and-wrap
round: 1
timestamp: 2026-08-19T16:48:00+07:00
verdict: ✅ ĐỒNG Ý
---

# Expert Review: fix-print-table-overflow-and-wrap

## Findings

### FR-01: Đảm bảo cách ly điều kiện colgroup và CSS riêng cho từng loại bảng
- **Severity**: Low
- **Confidence**: High
- **Issue**: Hàm `generateGenericReportHtml` được sử dụng chung cho nhiều loại báo cáo kế toán (KPCĐ, Danh mục đơn vị, Khoản khấu trừ, Phân bổ, Hạch toán lương).
- **Evidence**: Trong `generateGenericReportHtml`, các nhánh xử lý `colgroup` và class bảng được phân tách bằng `title.toUpperCase().includes(...)` và `data[0].length`.
- **Impact**: Nếu đặt điều kiện quá rộng có thể ảnh hưởng ngoài ý muốn đến các bảng generic 4 cột hoặc bảng KPCĐ.
- **Required Fix**: Tiếp tục tuân thủ kiểm tra chặt chẽ điều kiện `title.toUpperCase().includes("PHÂN BỔ")` (23 cột) và `title.toUpperCase().includes("HẠCH TOÁN LƯƠNG")` (22 cột) khi áp dụng colgroup và class CSS.

### FR-02: Kiểm chứng với các trường hợp biên số liệu lớn (>= 13 chữ số)
- **Severity**: Low
- **Confidence**: High
- **Issue**: Trong tương lai hoặc các kỳ lương đặc biệt (thưởng tết, truy lĩnh nhiều tháng), số liệu tổng có thể đạt mốc hàng chục tỷ (14 ký tự).
- **Evidence**: Hiện tại số tiền tỷ như `1.059.172.613` (13 ký tự) đã chạm ngưỡng giới hạn của ô 80px khi chưa có `nowrap`.
- **Impact**: Cột có thể bị tràn nếu không đủ khoảng trống dự phòng.
- **Required Fix**: Sử dụng `white-space: nowrap !important;` trên tất cả các ô số liệu và cấp độ rộng tối thiểu 88px - 98px cho các cột tổng tiền / thực lĩnh.

### FR-03: Đảm bảo độ rõ nét của typography ở cỡ chữ 6.8pt - 7.0pt
- **Severity**: Low
- **Confidence**: High
- **Issue**: Bảng 22 và 23 cột trên A4 Landscape bắt buộc phải thu nhỏ cỡ chữ xuống 6.8pt - 7.0pt để vừa 1 trang.
- **Evidence**: Font `Times New Roman` có chân ở cỡ 6.8pt có thể hơi mờ hơn font không chân khi in máy in thường.
- **Impact**: Trải nghiệm đọc trên bản in giấy.
- **Required Fix**: Áp dụng font sans-serif (`font-family: Tahoma, Arial, sans-serif !important;`) cho các ô số liệu trong `.phanbo-table td` để nét số sắc sảo và rõ ràng nhất.

## Khuyến nghị không chặn rollout
- Cả 3 findings đều ở mức `Low` và là khuyến nghị tối ưu hóa, đã được tích hợp đầy đủ vào chiến lược triển khai trong `FEATURE_PLAN.md` và `FEATURE_TASKS.md`.

## Cần xác thực thêm
- Không có.
