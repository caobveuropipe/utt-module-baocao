# Changelog FE - Clinic Revenue Management

> Phạm vi: Frontend, UI, UX, state client, routing, hiển thị, validation phía client
> Format: [Conventional Commits](https://www.conventionalcommits.org/)
> Ngôn ngữ: Tiếng Việt

---

## 2026-04-16

### fix: loại bỏ tiền tố numbering cho các loại báo cáo
- Loại bỏ các tiền tố "2.1 - ", "2.2 - "... trong dropdown chọn loại báo cáo để giao diện gọn gàng hơn theo yêu cầu người dùng.
- Files: `client/index.html`

## 2026-06-25

### fix(thuyet-minh): sửa lỗi tự tính lại lương sau khi xóa dữ liệu
- Thêm cờ `isFirstLoad` vào `functionInit` để ngăn chặn việc tự động chạy tính lương khi reload trạng thái tháng.
- Cập nhật hàm gọi `functionInit(false, false)` khi xóa dữ liệu thành công ở cả L1 và L2.
- Files: `ThuyetMinhL1/client/pg_general_3.html`, `ThuyetMinhL2/client/pg_general_3.html`, `ThuyetMinhL1/client/modal_dataluong_3.html`, `ThuyetMinhL2/client/modal_dataluong_3.html`

---

*Cập nhật tự động bởi update-docs*
