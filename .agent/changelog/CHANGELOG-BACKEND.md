# Changelog Backend - ThuyetMinhL1

> Format: [Conventional Commits](https://www.conventionalcommits.org/)
> Ngôn ngữ: Tiếng Việt
> Scope: `doGet/` + `doPost/` — Server-side logic

---

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
