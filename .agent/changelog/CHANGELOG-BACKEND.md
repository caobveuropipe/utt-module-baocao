# Changelog Backend - ThuyetMinhL1

> Format: [Conventional Commits](https://www.conventionalcommits.org/)
> Ngôn ngữ: Tiếng Việt
> Scope: `doGet/` + `doPost/` — Server-side logic

---

## [2026-07-11]

### feat(print-api): xây dựng 7 API JSON thô phục vụ in ấn
- **doGet (Các file logic):** Triển khai trích xuất dữ liệu thô phục vụ kết xuất in HTML thay vì render PDF ở server-side cho:
  - Bảng tổng hợp bảo hiểm (`getPrintDataTongHopBaoHiem`)
  - Bảng các khoản khấu trừ (`getPrintDataTongHopKhoanTru`)
  - Bảng tổng hợp KPCĐ (`getPrintDataTongHopKPCD`)
  - Bảng hạch toán bảo hiểm (`getPrintDataHachToanBaoHiem` - tích hợp làm tròn đơn vị hàng chi tiết và cộng dồn dòng tổng)
  - Bảng hạch toán KPCĐ (`getPrintDataHachToanKPCD`)
  - Bảng phân bổ tiền lương và BHXH (`getPrintDataPhanBoLuongBHXH`)
  - Bảng hạch toán lương và truy lĩnh (`getPrintDataHachToanLuongVaTruyLinh`)
- **Đăng ký Route:** Cấu hình routing cho các endpoint thô và whitelist `location` trong `doGet/Code.js`.

## [2026-07-10]

### style(hach-toan): tối ưu lề trang in, đổi font Arial và căn chỉnh cỡ chữ báo cáo hạch toán
- **Cấu hình lề in:** Đặt lề trái `0.5` inch (chừa chỗ đóng quyển), các lề khác `0.25` inch (lề trên Lương & Truy lĩnh và Phân bổ lương là `0.5` inch) cho cả 4 báo cáo hạch toán.
- **Font & Cỡ chữ hạch toán:** 
  - Đồng bộ font chữ sang **Arial** để hiển thị sắc nét hơn trên PDF.
  - Cỡ chữ dữ liệu chính đặt về `10.5` (Bảo hiểm & KPCĐ đặt là `10`).
  - Dòng đầu cột (header) đặt là `11` (riêng dòng 9 của Phân bổ lương là `10`).
  - Dòng tiêu đề chính đặt là `12` (chặn đè font size từ fullRange).
- **Lặp lại header:** Thêm `sheet.setFrozenRows(6)` và `&fzr=true` cho Hạch toán bảo hiểm để tự động lặp lại dòng tiêu đề/header từ trang 2.
- **Độ rộng cột:** Giảm 20% độ rộng cột Nội dung trong báo cáo Lương & Truy lĩnh để tối ưu không gian cho các cột số liệu.

## [2026-06-30]

### feat(insurance): làm tròn số tiền bảo hiểm và điền công thức Excel động
- **doGet (Bảo hiểm):** Cập nhật file `doGet/doGet_tongHopBaoHiem.js` để làm tròn các giá trị BHXH, BHYT, BHTN chi tiết của NLĐ và Nhà trường về hàng đơn vị bằng `Math.round()` trước khi tính tổng.
- **Công thức Excel động:**
  - Thay thế số tĩnh bằng công thức Excel có dấu chấm phẩy (`;`) làm dấu ngăn cách và dấu phẩy (`,`) làm dấu thập phân cho số thực (như `17,5` và `1,5`).
  - Cột E, F, G, I, J, K trên các dòng nhóm (I-IV) dùng `=SUBTOTAL(9; E8:E10)`, dòng Cộng dùng `=SUBTOTAL(9; E7:E22)`, dòng Mã LA dùng `=SUBTOTAL(9; E27:E28)`.
  - Dòng Mã HW dùng phép trừ trực tiếp `=E23-E26`. Dòng Cộng cuối cùng dùng phép cộng trực tiếp `=E26+E29`.
  - Cột H và L sử dụng hàm `=SUM(...)` cho 3 cột đứng trước. Cột M dùng `=H[row]+L[row]`.
  - Tự động map tên mã tách biệt cho khu vực Hà Nội thành `Mã LA0001N (đi nước ngoài)` và `Mã HW0013N`.

## [2026-06-29]

### feat(kpcd): thay đổi công thức tính KPCĐ và lọc đi công tác NN
- **doGet (KPCĐ):** Cập nhật file `doGet/doGet_tongHopKPCD.js` để tìm và đọc cột `BHXH` thay vì cột `KPCĐ` của bảng `DataLuong1` và `DataTruyThuLinh`.
- Áp dụng công thức tính KPCĐ mới: `(BHXH / 8) * 2` cho từng dòng nhân viên (bằng $25\%$ số tiền đóng BHXH của NLĐ).
- **doGet (Bảo hiểm):** Sửa đổi biểu thức điều kiện xác định đi nước ngoài (Mã LA) trong `doGet/doGet_tongHopBaoHiem.js` để hỗ trợ thêm trạng thái `'Đi công tác NN'` bên cạnh `'Đi NN'`.

## [2026-06-19]

### feat(doGet): lọc nhân sự Phú Thọ có trạng thái khi xuất bảng đi kho bạc
- **File:** `doGet/doGet_tongHopCk.js` → hàm `doGet_tongHopDiNganHang`
- Thêm dò cột `Trạng thái` từ sheet `DataChotNSThang` bằng `getIdx` (alias: `Trạng thái`, `Status`, `TrangThai`)
- Throw lỗi chặn xuất báo cáo khi chọn Phú Thọ mà thiếu cột Trạng thái (`idx7.TrangThai === -1`)
- Lọc bỏ nhân sự Phú Thọ có trạng thái khác `"Đang làm"` tại vòng lặp tạo output
- Ghi log chi tiết (Mã NS, Họ tên, Trạng thái) cho mỗi người bị lọc
- Không ảnh hưởng logic xuất cho Hà Nội hoặc Tất cả (`All`)
- Áp dụng cho cả In PDF/HTML và Xuất Excel (cùng data source `doGet_tongHopDiNganHang`)

## [2026-06-25]

### fix(thuyet-minh): sửa lỗi logic phản hồi in L1 và tối ưu hiệu năng bằng Sheets API
- **doPost:** Sửa logic check response `action === 'print'` trong `ThuyetMinhL1/doPost/Code.js` sang `Array.isArray(strReturn)` để trả về thành công thay vì chuỗi `"Success"`.
- **doGet (L1 & L2):** Chuyển đổi các hàm đọc sheet lớn (`doGet_getDataNhanSu_SoTaiKhoan`, `doGet_getDataChotNSThang`, `doGet_getDataChotNSThang_WithBankInfo`, và đọc `DataLuong1` phụ cấp L1) sang sử dụng Sheets Advanced Service (`Sheets.Spreadsheets.Values.get`) với `valueRenderOption` thích hợp, tăng tốc độ phản hồi in dưới 10 giây.
- **doGet (L2):** Refactor tránh duplicate read master data `DataNhanSu` 2 lần trong 1 request bằng cách truyền map qua đối số.
- **Files:** `ThuyetMinhL1/doPost/Code.js`, `ThuyetMinhL1/doGet/doGet_function.js`, `ThuyetMinhL2/doGet/doGet_function.js`

---

## [2026-04-12]

### feat: Khởi tạo hệ thống changelog
- Bắt đầu theo dõi thay đổi backend cho dự án ThuyetMinhL1
- doGet: `Code.js` (routing), `doGet_function.js` (đọc dữ liệu, print templates)
- doPost: `Code.js` (ghi/xử lý dữ liệu — file chính ~145KB)

---

*Cập nhật tự động bởi skill-update-docs*
