# Feature Tasks: Cập nhật mẫu chữ ký bảng đi kho bạc

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-05-19

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Cập nhật mẫu chữ ký trong code HTML

**Mục tiêu:** Thêm các dòng nhãn chữ ký tương ứng vào cột chữ ký bên trái của bảng kê trong `client/pg_general_3.html`.

- [x] Task 1.1: Tìm hàm `generateCkHtml(res, location)` trong `client/pg_general_3.html`.
- [x] Task 1.2: Cập nhật đoạn code ghép chuỗi tạo nhãn "Cán bộ tiếp nhận" bằng cách thêm 2 dòng chữ phía trên:
  - "Phần dành cho ngân hàng"
  - "I/Xác nhận dành cho bộ phận tiếp nhận yêu cầu"
- [x] Task 1.3: Cập nhật đoạn code ghép chuỗi tạo nhãn "Giao dịch viên" bằng cách thêm 1 dòng chữ phía trên:
  - "II/Phần xác nhận dành cho bộ phận xử lý yêu cầu"
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc)

## Phase 2: Kiểm tra kết quả hiển thị bản in

**Mục tiêu:** Xác nhận bản in A4 landscape hiển thị đúng bố cục mẫu và các nhãn mới thêm.

- [x] Task 2.1: Nhấp in bảng chuyển khoản ngân hàng từ giao diện client.
- [x] Task 2.2: Kiểm tra bố cục trang in landscape, đảm bảo các dòng chữ ký không bị tràn sang trang thứ 2 do tăng chiều cao.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Bắt buộc)

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-05-19 16:20 | Phase 1 | Khởi tạo | Tạo kế hoạch và danh sách task | done | |
| 2026-05-19 16:25 | Phase 1 | Tasks 1.1-1.3 | Cập nhật nhãn chữ ký trong HTML | done | |
| 2026-05-19 16:30 | Phase 2 | Tasks 2.1-2.2 | Kiểm tra in ấn thủ công | done | Bố cục in cân đối |
