# Feature Tasks: Khắc phục lỗi lấp số và wrap text trên các dòng Tổng/Cộng khi in báo cáo

> **Trạng thái**: 🔄 Đang thực hiện  
> **Liên kết plan**: `FEATURE_PLAN.md`  
> **Ngày tạo**: 2026-08-19  

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

---

## Phase 1: Xử lý Bảng Tổng hợp nộp Bảo hiểm Xã hội, BHYT, BHTN (Hình 1)

**Mục tiêu:** Đảm bảo các số liệu tiền tỷ tại cột BHXH 17.5%, Thành tiền và Tổng tiền không bị rớt chữ số xuống dòng 2 khi in.

- [x] Task 1.1: Cập nhật hàm `generateTongHopBaoHiemHtml` trong `client/pg_general_3.html`:
  - Thêm `white-space: nowrap !important;` cho tất cả các ô chứa số (`td` từ cột 2 đến cột 10).
  - Tái phân bổ độ rộng `colgroup` 11 cột: Nới rộng cột BHXH 17.5% (từ 80px lên 90px), Thành tiền NT (từ 85px lên 90px), Tổng tiền (từ 95px lên 98px); thu gọn nhẹ cột Nội dung (195px -> 170px) và STT (35px -> 30px).
  - Giảm padding ngang ô số từ 3px xuống 2px và tinh chỉnh font-size ô số để vừa vặn tối ưu.
- [/] Task 1.Final: 🧪 Test & Verify Phase 1 (Kiểm tra hiển thị và Print Preview Bảng Tổng hợp nộp BHXH với các giá trị tiền tỷ `1.059.172.613`, `1.048.215.211`).

---

## Phase 2: Xử lý Bảng Phân bổ tiền lương và BHXH (Hình 2) & Bảng Kê hạch toán lương (Hình 3)

**Mục tiêu:** Tối ưu hóa layout 23 cột và 22 cột trong `generateGenericReportHtml`, xóa bỏ hoàn toàn hiện tượng lấp số/đè viền ở các dòng Tổng và Phụ cấp.

- [x] Task 2.1: Tối ưu nhánh Bảng Phân bổ (23 cột) trong `generateGenericReportHtml`:
  - Tái cân đối `colgroup` 23 cột: nới rộng các cột giảm trừ/chi trả (N/ngoài: 62px, Nghi BHXH: 62px, Tạm ứng: 56px, Quỹ XH: 58px, BH trả: 58px, Số lĩnh: 88px) bằng cách thu gọn nhẹ các cột hệ số ít biến động (HSB BL: 38px, Chức vụ: 38px, ĐH: 36px, TN: 36px, Tự vệ: 36px, Nội dung: 145px).
  - Giảm padding `.phanbo-table td` xuống `3px 1.5px !important;`.
  - Thiết lập font size riêng cho các dòng `bold-row` là `6.8pt !important;` kèm `white-space: nowrap !important;`.
- [x] Task 2.2: Tối ưu nhánh Bảng Kê hạch toán lương và truy lĩnh (22 cột) trong `generateGenericReportHtml`:
  - Tái cân đối `colgroup` 22 cột: nới rộng các cột phụ cấp chứa số liệu lớn (PCĐH: 68px, PCTN: 65px, PCVK: 62px, PCGV: 65px, PCTNGV: 65px, PCCV: 62px, BHXH: 68px).
  - Đảm bảo các ô số liệu dòng `A.` và dòng `Tổng cộng: A+B+C-D` không bị tràn hoặc bị `overflow: hidden` cắt xén.
  - Tinh chỉnh CSS `@media print` cho bảng hạch toán để tỷ lệ co giãn (zoom/table-layout) tương thích hoàn hảo với trang A4 Landscape.
- [/] Task 2.Final: 🧪 Test & Verify Phase 2 (Kiểm tra Print Preview cả 2 bảng Phân bổ & Hạch toán lương, xác nhận các số `34.746.192`, `17.571.060`, `1.119.871.800`, `617.407.900` hiển thị đầy đủ, sắc nét).

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-08-19 | Phase 1 & 2 | Khởi tạo | Tạo kế hoạch chi tiết khắc phục lỗi in ấn | done | Đã qua review hội đồng |
| 2026-08-19 16:48 | Phase 1 | Task 1.1 | Cập nhật generateTongHopBaoHiemHtml (colgroup, nowrap, padding) | done | Hoàn tất code Phase 1 |
| 2026-08-19 16:49 | Phase 1 | Task 1.Final | AI self-test code HTML và syntax | done | Phase 1 sẵn sàng test |
| 2026-08-19 16:50 | Phase 2 | Task 2.1 & 2.2 | Cập nhật generateGenericReportHtml (colgroup 22/23 cột, padding, font 6.8pt, nowrap) | done | Hoàn tất code Phase 2 |
| 2026-08-19 16:59 | Phase 1 & 2 | Deploy Cloud | Chạy push-all.ps1 đồng bộ client/ lên Google Apps Script | done | Sẵn sàng cho User test trực tiếp |
| 2026-08-19 17:07 | Phase 1 & 2 | Dynamic Auto-Fit | Triển khai thuật toán tính độ rộng cột động theo dữ liệu dòng Tổng/Cộng, đồng nhất 100% font-size | done | Đã push cloud |
| 2026-08-19 17:09 | Phase 1 & 2 | Hotfix Syntax | Sửa lỗi thiếu thẻ đóng chuỗi colgroup trong generateGenericReportHtml | done | Đã push cloud thành công |
| 2026-08-19 17:12 | Phase 1 | Cấu hình khổ in | Đặt khổ giấy mặc định A4 Ngang (Landscape) cho Bảng Tổng hợp nộp BHXH | done | Đã push cloud thành công |
| 2026-08-19 17:15 | Phase 2 | Tối ưu kích thước in | Thu gọn các cột chỉ chứa số 0 (xuống 36px), tăng cỡ chữ lên 7.0pt, tăng zoom in lên 86% | done | Đã push cloud |
| 2026-08-19 17:21 | Phase 2 | Chuẩn hóa minColWidth | Đặt độ rộng tối thiểu cột tổng = 0 bằng cột PC TV (46px), nới rộng cột 14 số lên 92px, font 6.6pt | done | Đã push cloud thành công |

