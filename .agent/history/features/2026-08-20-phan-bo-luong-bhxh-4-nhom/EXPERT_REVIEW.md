---
source: feature-review
feature: phan-bo-luong-bhxh-4-nhom
round: 1
timestamp: 2026-08-20T11:36:00+07:00
verdict: ⚠️ CẦN SỬA
---

# Expert Review: phan-bo-luong-bhxh-4-nhom

## Findings

### FR-01: Thiếu đánh giá tác động và test client-side (pg_general_3.html)
- **Severity**: Medium
- **Confidence**: High
- **Issue**: Plan mục 6 chỉ liệt kê `doGet_phanBoLuongBHXH.js` mà không nhận diện `pg_general_3.html` là file phụ thuộc. Client-side rendering (dòng 673-685) có logic bôi đậm dựa trên cấu trúc dữ liệu trả về (Roman numeral detection, "cộng" keyword). Logic này *tương thích tự nhiên* với cấu trúc mới nhưng plan không ghi nhận và thiếu task kiểm thử client in.
- **Evidence**: `pg_general_3.html` dòng 675: `isRoman = /^[IVXLCDM]+$/.test(stt)`, dòng 676: `isTotalRow = rowStr.toLowerCase().includes("cộng")`. FEATURE_TASKS.md Phase 3 không có task kiểm thử client in.
- **Impact**: Dữ liệu có thể đúng trên Sheet nhưng hiển thị sai trên bản in web (vỡ layout, sai format) mà không được phát hiện.
- **Required Fix**: Bổ sung `client/pg_general_3.html` vào mục 6 (hành động: Kiểm tra). Thêm task kiểm thử client in trong Phase 3.

### FR-02: Logic tích lũy dòng CỘNG HĐDH + HĐ 68 cần thiết kế tường minh hơn
- **Severity**: Medium
- **Confidence**: High
- **Issue**: Dòng `CỘNG HĐDH + HĐ 68` cộng gộp subtotal Mục II + Mục III nhưng plan không chỉ rõ cơ chế tích lũy. Đặc biệt, dòng này là dòng display-only, KHÔNG được cộng vào `grandTotal` (vì `grandTotal` đã nhận subtotal từ cả II lẫn III riêng).
- **Evidence**: `doGet_phanBoLuongBHXH.js` dòng 395-449: vòng lặp `MAIN_ORDER.forEach` tạo `subTotal` riêng cho mỗi `mainKey` rồi cộng vào `grandTotal`. Cần biến `subTotalHDDH` riêng để lưu subtotal Mục II.
- **Impact**: Nếu cộng dòng `CỘNG HĐDH + HĐ 68` vào `grandTotal` sẽ làm lệch kép tổng cộng — vi phạm "cấm kỵ" quan trọng nhất trong KB.
- **Required Fix**: Plan Phase 2 Task 2.3 cần ghi rõ: (1) lưu `subTotalHDDH` riêng sau khi render Mục II, (2) `CỘNG HĐDH + HĐ 68 = subTotalHDDH + subTotalHD68` chỉ dùng để render dòng hiển thị, (3) không cộng vào `grandTotal`.

### FR-03: HĐ vụ việc thiếu fallback khi master undefined
- **Severity**: Low
- **Confidence**: Medium
- **Issue**: Code hiện tại cho phép `HD_VU_VIEC` bỏ qua yêu cầu có `master` (dòng 240-246, 250-255). Plan yêu cầu phân loại theo `master.LoaiDV`, nhưng nếu nhân sự không có trong `mapMaster` thì `master.LoaiDV` gây runtime error.
- **Evidence**: Dòng 240: `if (mainKey !== 'HD_VU_VIEC') { if (!master) { return; } }` — HĐ vụ việc được phép không có master. Dòng 250: `subKey = 'Tất cả'` hiện tại không cần master.
- **Impact**: Thấp nếu 100% HĐ vụ việc đều trong Setup, nhưng cần fallback phòng hờ.
- **Required Fix**: Task 1.2 ghi rõ fallback: nếu `master` undefined cho `HD_VU_VIEC`, mặc định `subKey = 'Trực tiếp'`.

### FR-04: Thiếu test khu vực All trong FEATURE_TASKS
- **Severity**: Low
- **Confidence**: High
- **Issue**: Plan Phase 3 đề cập test `All` nhưng FEATURE_TASKS.md Task 3.3 chỉ nêu `Hà Nội`.
- **Evidence**: FEATURE_TASKS.md Task 3.3: "Chạy test...trên tháng T06.2026 với khu vực Hà Nội".
- **Impact**: Không phát hiện lỗi tổng cộng khi gộp tất cả khu vực.
- **Required Fix**: Bổ sung `All` vào Task 3.3.

### FR-05: Audit function cần chi tiết đồng bộ label mapping
- **Severity**: Low
- **Confidence**: Medium
- **Issue**: Hàm `auditChiTietPhanBoLuongBHXH()` có logic phân loại riêng biệt (dòng 913). Task 1.4 nêu đồng bộ nhưng không chi tiết mapping label cho nhóm `HD_68` mới.
- **Evidence**: Dòng 913: `const dongPhanBo = \`${mainLabel} -> ${subLabel} -> ${deptLabel}\`;` — cần thêm mainLabel cho `HD_68`.
- **Impact**: Audit function sẽ báo sai nhóm nếu không đồng bộ.
- **Required Fix**: Task 1.4 ghi rõ thêm `mainLabel` mapping cho `HD_68` và `subLabel` mapping cho `Gián tiếp`/`Trực tiếp`.

## Khuyến nghị không chặn rollout
- Tất cả 5 findings đều ở mức Medium/Low và có hướng sửa rõ ràng. Có thể sửa nhanh plan rồi đi thẳng vào triển khai mà không cần re-review.

## Cần xác thực thêm
- Không có.
