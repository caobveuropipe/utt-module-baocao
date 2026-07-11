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

## 2026-07-11

### feat(print-ui): chuẩn hóa form in HTML động và tái thiết kế hộp thoại xuất file
- **Tái thiết kế Modal Xuất:** Định cấu hình dàn ngang 3 nút (In, PDF, Excel) trên cùng 1 dòng, giảm cỡ chữ xuống 13px, đưa nút máy in sang lề trái ngoài cùng trên cả 5 modal chọn in trong `client/pg_general_4.html`.
- **Tối ưu hóa Styling In Ấn (`client/pg_general_3.html`):**
  - Thiết lập lề in chuẩn, lặp lại tiêu đề khi ngắt trang (`table-header-group`).
  - Chuyển sang font **Tahoma** nét đậm vừa phải (`weight 500` cho dòng thường, `bold` cho dòng tổng), tối ưu cỡ chữ nhỏ (5.8pt - 6.8pt) triệt tiêu hoàn toàn lỗi tràn số, mất số.
  - Triển khai đường viền nét chấm (`1px dotted`) cho các dòng chi tiết thường, và nét liền (`solid`) phân tách rõ nét đối với dòng tiêu đề và dòng tổng.
  - Cải tiến thuật toán phát hiện cột STT (nhận diện "Số TT", "SO TT", "STT") để tự động căn lề giữa.

---

*Cập nhật tự động bởi update-docs*
