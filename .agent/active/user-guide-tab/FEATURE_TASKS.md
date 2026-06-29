# Feature Tasks: Hướng dẫn sử dụng (User Guide Tab)

> **Trạng thái**: ⏳ Chưa bắt đầu
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-04-19

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Triển khai UI & Nội dung

**Mục tiêu:** Thêm tab Hướng dẫn vào Sidebar và hiển thị nội dung hướng dẫn chi tiết.

- [ ] Task 1.1: Cập nhật `client/styles.html` thêm các class CSS cho trang hướng dẫn (stepper, guide-card, code-snippet).
- [ ] Task 1.2: Cập nhật `client/index.html` thêm item "Hướng dẫn" (`fa-book`) vào Sidebar Nav.
- [ ] Task 1.3: Cập nhật `client/index.html` thêm `<div id="view-user-guide" class="content-view">` với nội dung chi tiết về:
    - Danh mục (Nhân sự, Dịch vụ).
    - Chuẩn bị file Excel (Headers quan trọng).
    - Luồng Upload & Kiểm trùng.
    - Video/Hình ảnh mô phỏng (dùng icon/phông chữ).
- [ ] Task 1.4: Cập nhật `client/scripts.html` hàm `initNavigation` để ẩn/hiện header actions phù hợp khi ở trang Hướng dẫn.
- [ ] Task 1.5: Cập nhật `client/scripts.html` hàm `syncPageTitle` để hiển thị tiêu đề "Hướng dẫn sử dụng".
- [ ] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc)

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-04-19 | Phase 1 | Lập kế hoạch | Tạo Feature Plan và Tasks | done | Sẵn sàng cho review |
