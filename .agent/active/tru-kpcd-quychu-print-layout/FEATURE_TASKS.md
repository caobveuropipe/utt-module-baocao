# Feature Tasks: Điều chỉnh bản in trừ KPCĐ và các quỹ

> **Trạng thái**: 🔄 Đang thực hiện
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-06-26

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Điều chỉnh CSS/HTML trong pg_general_3.html

**Mục tiêu:** Giảm kích thước cột/font-size và triển khai layout 3 chữ ký.

- [x] Task 1.1: Chỉnh sửa hàm `generateTruKPCDHtml` trong [pg_general_3.html](file:///d:/Project/UoTT/Dikhobac/client/pg_general_3.html).
  - Giảm font-size cho table `th, td` xuống `9.5pt` hoặc `9pt`.
  - Điều chỉnh `width` của các cột `STT`, `Mã CB`, `Họ và tên`, `KPCĐ`, `Quỹ tình nghĩa`, `Các khoản thu khác` trong thẻ `thead` để tránh tràn lề phải.
- [x] Task 1.2: Cập nhật HTML chữ ký từ 1 chữ ký thành 3 chữ ký hàng ngang ("Kế toán lương", "Kế toán trưởng", và "Thủ trưởng đơn vị" kèm tên "TS. Nguyễn Văn Lâm").
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc)
  - Xem trước bản in bằng cách chọn xuất báo cáo trừ KPCĐ và quỹ trên giao diện ứng dụng.
  - Kiểm tra bảng căn chỉnh vừa khít lề phải.
  - Đảm bảo 3 chữ ký được bố trí đúng vị trí cân đối.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-06-26 12:02 | Phase 1 | Task 1.1 & 1.2 | Bắt đầu điều chỉnh css/html và layout chữ ký | start | |
| 2026-06-26 12:03 | Phase 1 | Task 1.1 & 1.2 | Hoàn tất điều chỉnh css/html và layout chữ ký | done | Chuẩn bị chuyển sang bước test |
| 2026-06-26 12:10 | Phase 1 | Task 1.2 & Layout | Loại bỏ tên TS. Nguyễn Văn Lâm, thêm đánh số trang in, thu hẹp khoảng cách chữ ký, và gom nhóm tránh ngắt trang mồ côi | done | Cần User xác nhận lại |
| 2026-06-26 12:28 | Phase 1 | Task 1.Final | Revert tính năng chia trang thủ công bằng JS, áp dụng định dạng trang in và phân trang native bằng `@page` CSS lấy cảm hứng từ Luong2 | done | Đã hoàn tất và sẵn sàng deploy kiểm thử |

