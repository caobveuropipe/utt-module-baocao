# Changelog FE - Clinic Revenue Management

> Phạm vi: Frontend, UI, UX, state client, routing, hiển thị, validation phía client
> Format: [Conventional Commits](https://www.conventionalcommits.org/)
> Ngôn ngữ: Tiếng Việt

---

## 2026-08-22

### feat(init-ui): áp dụng SSR nạp sẵn danh sách tháng, nút refresh và dọn dẹp thư viện
- **Server-Side Data Injection (SSR):** Nhúng sẵn dữ liệu `initialData` (`listThang`, `listDiaPhuong`) từ server template vào `window.__INITIAL_DATA__`, đổ trực tiếp vào dropdown Select2 `#modal_dataluong_2_ChonThang` ngay khi mở trang, giảm thời gian render sẵn sàng từ ~4-6s xuống < 500ms mà không cần xoay spinner.
- **Nút Refresh Danh Sách Tháng:** Bổ sung nút refresh tròn nhỏ cạnh dropdown chọn tháng, hỗ trợ hàm `refreshListThang()` kèm hiệu ứng xoay icon `fa-spin` để đồng bộ dữ liệu mới nhất từ Google Sheets khi cần.
- **Dọn dẹp CDN Assets (`client/modal_library.html`):** Gỡ bỏ 9 file CSS/JS DataTables dư thừa, giúp trang nhẹ hơn và tăng tốc độ First Contentful Paint.
- **Files:** `client/pg_general_2.html`, `client/pg_general_3.html`, `client/modal_library.html`

## 2026-08-21

### chore(export-ui): loại bỏ tùy chọn xuất PDF khỏi các dialog báo cáo
- Xóa nút **Xuất PDF** và toàn bộ event listener `swal-btn-pdf` khỏi các dialog:
  - Báo cáo các khoản trừ (`taoBangTongHopKhoanTru`)
  - Báo cáo Đoàn phí CĐ (`taoBangTongHopKPCD`)
  - Báo cáo generic (bao gồm `taoBangHachToanBaoHiem`)
- Hàm `pg_general_4_exportDanhMucDonVi`: Bỏ dialog chọn In / Excel, nay gọi thẳng `printDanhMucDonVi()`.
- **Files:** `client/pg_general_4.html`, `client/pg_general_3.html`

## 2026-08-20

### feat(ck-ui): bổ sung tùy chọn in và xuất Excel danh sách treo lương cơ sở Phú Thọ
- **Popup lựa chọn loại bảng:** Khi chọn cơ sở **Phú Thọ**, hệ thống hiển thị hộp thoại SweetAlert2 cho phép chọn:
  - *In bảng chuyển khoản* hoặc *In bảng treo lương*.
  - *Xuất Excel chuyển khoản* hoặc *Xuất Excel treo lương*.
- **Render template in HTML (`client/pg_general_3.html`):**
  - Đổi tiêu đề động thành **`DANH SÁCH TREO CHƯA CHI TRẢ TIỀN LƯƠNG`** khi xem bảng treo lương.
  - Đổi chức danh chữ ký từ **`Kế toán trưởng`** sang **`Phụ trách kế toán`**.
  - Tự động ẩn toàn bộ **`Phần dành cho ngân hàng`** đối với bảng treo lương.
- **Files:** `client/pg_general_1.js`, `client/pg_general_3.html`, `client/pg_general_4.html`

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


## 2026-07-31

### fix(print-ui): sửa lỗi in thiếu cột thực lĩnh và lấp số/tràn số cột tiền
- **Đồng bộ hóa 22 cột in:** Cập nhật lại danh sách `<col>` (`colgroupHtml`) cho báo cáo Hạch toán lương để hiển thị đầy đủ 22 cột (thêm cột tự vệ `PC TV` và bổ sung cột độc hại `PCĐH`), khắc phục triệt để lỗi mất cột **Thực lĩnh**.
- **Căn chỉnh độ rộng và cỡ chữ:** Tăng độ rộng cột dữ liệu từ cột thứ 2 (Tổng lương: 85px, Thực lĩnh: 90px, các cột bảo hiểm: 60px, v.v.), giảm cỡ chữ hiển thị xuống `5.8pt` (detail row) và `5.5pt` (bold row), giảm padding ngang xuống `1.5px` để đảm bảo vừa khít dữ liệu lớn như hàng tổng cộng `A+B+C-D` mà không bị lấp/che số.
- **Tối ưu hóa Responsive:** Đổi thuộc tính `.page-container` từ `overflow: hidden` sang `overflow-x: auto` giúp hiển thị thanh cuộn ngang trên các màn hình thiết bị nhỏ hơn mà không ảnh hưởng khi in ra giấy.

### fix(print-ui): Cải tiến căn lề giữa cột STT và nhận diện từ khóa
- Bổ sung thêm từ khóa viết liền `"SỐTT"` vào bộ quét tự động căn lề giữa cột STT của bảng dữ liệu xem trước.
- Files: `client/pg_general_3.html`

## 2026-08-18

### fix(print-ui): tối ưu hiển thị màn hình HTML bảng phân bổ lương và BHXH chống vỡ chữ
- **Cấu trúc Header 3 hàng:** Chuẩn hóa ô "Tổng lương" thành `rowspan="2"` ở hàng 1, giúp 17 ô ở hàng 2 map chính xác vào các nhóm cột tương ứng.
- **Kích thước tối thiểu & Chống vỡ chữ dọc:** Cấu hình `colgroup` kích thước tối thiểu cho 23 cột, đặt `min-width: 1410px` và `table-layout: fixed` cho `.phanbo-table` trên màn hình HTML; thiết lập `word-break: normal; white-space: normal;` cho các tiêu đề và cột nội dung để ngăn chặn triệt để lỗi rớt chữ thành từng ký tự dọc.
- **Bảo toàn nguyên vẹn bản in:** Thiết lập reset `min-width: unset !important; width: 100% !important;` trong `@media print` để bảo đảm bản in giấy/PDF giữ nguyên tỷ lệ khổ ngang A4 Landscape.
## 2026-08-19

### fix(print): tối ưu độ rộng cột tự động và đồng bộ cỡ chữ bản in báo cáo lương bhxh
- **Thuật toán Dynamic Auto-Fit Colgroup:** Xây dựng cơ chế quét dữ liệu tự động đo độ dài ký tự tối đa của từng cột (bao gồm các dòng tổng/cộng) để phân bổ độ rộng cột tối ưu:
  - Các cột số tiền lớn hàng chục tỷ (14 chữ số như Tổng lương, LC 100%, LC hạch toán, Thực lĩnh): cấp độ rộng `92px`.
  - Cột 13 chữ số (PCĐH): cấp `78px`.
  - Cột có tổng cộng = 0 (hưởng 40% đi NN, Tạm ứng, treo lương, Thuế TNCN): khóa độ rộng tối thiểu an toàn `minWidth = 46px` (bằng đúng cột PC TV), ngăn chặn hoàn toàn việc tiêu đề bị rớt từng ký tự thành 1 dòng.
- **Đồng bộ hóa cỡ chữ (Uniform Font Size):**
  - Áp dụng một cỡ chữ chuẩn duy nhất `6.6pt !important; letter-spacing: -0.2px;` cho toàn bộ các ô số trong Bảng Phân Bổ (23 cột) và Bảng Hạch Toán (22 cột), loại bỏ tình trạng ô to ô nhỏ nhấp nhô.
  - Thiết lập cỡ chữ `8.8pt !important` và `padding: 4px 2px` cho Bảng Tổng hợp nộp BHXH.
- **Chuẩn hóa khổ in mặc định A4 Ngang:** Cấu hình `@page { size: A4 landscape; margin: 8mm 10mm 10mm 15mm; }` cho Bảng Tổng hợp nộp BHXH, tối ưu lề in và nới rộng cột Nội dung lên `210px`.
- Files: `client/pg_general_3.html`

---

*Cập nhật tự động bởi update-docs*
