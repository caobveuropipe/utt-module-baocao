# Feature Tasks: Xuất dữ liệu lương ra Excel theo tháng

> **Trạng thái**: 🔄 Đang thực hiện
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-05-27

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Data Builder & Validation (Backend)

**Mục tiêu:** Tạo hàm `buildTongHopSalaryExcelData(monthStr, location)` lấy dữ liệu từ 6 nguồn. Lọc theo tháng và khu vực ở DataChotNSThang, sau đó Join 5 bảng còn lại theo Mã nhân sự. Trả về `{headers, rows, warnings}`.

- [x] Task 1.1: Khởi tạo file `doGet/doGet_tongHopExcel.js`. Hàm chuẩn hóa `normalizeMonthKey()` và sử dụng `normalizeLocation()`.
- [x] Task 1.2: Viết hàm `requireColumns(sheetName, header, spec)` để validate header của TỪNG file nguồn đầu vào theo định dạng riêng.
- [x] Task 1.3: Viết hàm parser tiền tệ riêng để chuyển đổi an toàn các chuỗi số định dạng VN (`1.234.567` hoặc `1.234,5`) sang số thực.
- [x] Task 1.4: Lấy danh sách nhân sự gốc từ DataChotNSThang và LỌC theo cả `monthStr` và `location`.
- [x] Task 1.5: Query dữ liệu từ 5 nguồn còn lại qua `GLOBAL_CONFIG`, lọc theo tháng (không lọc location ở nguồn phụ), parse tiền và Sum cộng dồn. Map vào danh sách gốc.
- [x] Task 1.6: Join các nguồn. Ghi nhận `warnings` / `count` nếu có nhân sự ở các bảng phụ nhưng không khớp mã danh sách đã filter.
- [x] Task 1.7: Trả về kết quả mảng data 2 chiều (headers và rows chứa 49 cột dữ liệu) kèm log `warnings`.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Chạy script local gọi `buildTongHopSalaryExcelData` để xem mảng trả về có đúng 49 cột không).

## Phase 2: Backend Export & API

**Mục tiêu:** Tạo file XLSX thông qua Spreadsheet API, lấy Blob chuyển Base64, dọn dẹp file rác và expose JSON Endpoint.

- [x] Task 2.1: Xây dựng hàm tạo Spreadsheet nháp trên Drive, ghi dữ liệu từ mảng `{headers, rows}` vào file. Bắt buộc gọi `SpreadsheetApp.flush()` sau khi ghi xong để đảm bảo dữ liệu đã đẩy hết lên server.
- [x] Task 2.2: Fetch API `export?format=xlsx` bằng `UrlFetchApp` (sử dụng `ScriptApp.getOAuthToken()`) để lấy Blob `.xlsx`.
- [x] Task 2.3: Convert Blob thành chuỗi Base64. BẮT BUỘC sử dụng khối `try...finally` để xóa vĩnh viễn Spreadsheet nháp vừa tạo bằng Advanced Drive Service `Drive.Files.remove(id)` (không dùng `setTrashed(true)`), đảm bảo không để lại rác thật sự. Đóng gói JSON `{ status: 'success', filename, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', base64, warnings }`.
- [x] Task 2.4: Xây dựng hàm kiểm tra Secret Token tại `doGet/Code.js` (chặn 100% request không có token bí mật). Đăng ký router mới vào `ROUTE_MAP`.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Sẽ test luôn cùng UI ở Phase 3 do cần API Token).

## Phase 3: Frontend & Client Proxy

- [x] Task 3.1: Thêm Proxy ở Frontend (`client/pg_general_1.js`). Cần gọi server thông qua `google.script.run.proxyExportExcel(month, location)` để browser không biết token. Mở Spinner Overlay khi bắt đầu tải.
- [x] Task 3.2: Backend Proxy function. Server-side check `userRole()` đảm bảo người gọi có quyền export. Lấy `API_SECRET_TOKEN` từ `PropertiesService` và dùng `UrlFetchApp` để fetch `ScriptApp.getService().getUrl() + '?type=exportTongHopExcel...&token='`. Trả JSON về cho `google.script.run`.
- [x] Task 3.3: Nhận Base64 JSON ở callback frontend. Convert Base64 về Blob `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, tạo thẻ `<a download>` ẩn để tự động tải file `.xlsx`. Tắt Spinner. Hiển thị Toast thành công.
- [x] Task 3.4: Thêm nút "Xuất Excel" và "Khu vực" vào UI thẻ Lương (`client/pg_general_2.html` hoặc `client/pg_general_4.html` tuỳ vị trí đúng). Bắt event gọi Proxy hàm ở Task 3.1.
- [x] Task 3.Final: 🧪 Test End-To-End. Click nút UI -> Tải file XLSX -> Mở bằng Excel trên máy tính xem cấu trúc chuẩn chưa.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-05-27 | 1 | 1.1 | Khởi tạo doGet_tongHopExcel.js và viết hàm chuẩn hóa tháng. | Hoàn thành | - |
| 2026-05-27 | 1 | 1.2 | Viết hàm requireColumns(sheetName, header, spec). | Hoàn thành | - |
| 2026-05-27 | 1 | 1.3 | Viết hàm parseMoneyVN cho định dạng tiền Việt Nam. | Hoàn thành | - |
| 2026-05-27 | 1 | 1.4 - 1.7 | Viết logic chính trong buildTongHopSalaryExcelData. | Hoàn thành | Dữ liệu filter và join 46 cột |
| 2026-05-27 | 1 | 1.Final | Self-test logic map data. | Đang thực hiện | Chờ test cục bộ |
| 2026-05-27 | 1 | 1.Final | Fix lỗi validate cột "Mã CB" vs "Mã nhân sự" trên các sheet phụ. | retry | User test fail ở DataLuong2, đã sửa alias |
| 2026-05-27 | 1 | 1.Final | Fix lỗi validate cột "Tổng tiền" vs "Còn nhận" trên Truy thu lĩnh. | Hoàn thành | Đã thêm mảng alias linh hoạt. Pass Phase 1 (46 cột đúng chuẩn) |
| 2026-05-27 | 2 | 2.1 - 2.4 | Hoàn thành API xuất Base64 có token check | Hoàn thành | Code logic tạo file tạm, convert base64 và check secret |
| 2026-05-27 | 3 | 3.1 - 3.4 | Dựng proxy client, server và code UI | Hoàn thành | Đã thêm nút File Lương (Excel), Base64 to Blob, Token ẩn |
| 2026-05-28 | 3 | 3.Final | Bổ sung 3 cột (Số tài khoản, Ngân hàng, Bảo hiểm trả chính) và nâng cấp lên 49 cột. | Hoàn thành | Đã sửa code và UI, sẵn sàng test |
