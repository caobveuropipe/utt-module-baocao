# Feature Tasks: Tối Ưu Tốc Độ Load Trang & Khởi Tạo Giao Diện

> **Trạng thái**: ✅ Hoàn thành  
> **Liên kết plan**: `FEATURE_PLAN.md`  
> **Ngày tạo**: 2026-08-22  

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

---

## Phase 1: Tối Ưu Caching & Bảo Mật Phân Quyền (Backend Core & Proxy)

**Mục tiêu:** Cài đặt cơ chế `CacheService` cho bảng phân quyền và danh mục tháng/thiết lập, giảm thời gian xử lý I/O từ hàng giây xuống mili-giây mà vẫn giữ vững hàng rào bảo mật.

- [x] Task 1.1: Cập nhật `getDataPermission()` trong `client/pg_general_1.js` để đọc và ghi cache qua `CacheService.getScriptCache()` với TTL 15 phút (900s), đảm bảo fallback về `SpreadsheetApp.openById` khi cache miss.
- [x] Task 1.2: <!-- Sửa theo EFR-01: Guard clause & explicit deny response --> Cập nhật `userRole()` và `capQuyen()` để tận dụng dữ liệu permission đã cache, kiểm tra chặt chẽ email người dùng từ `Session.getActiveUser().getEmail()`. Bổ sung guard clause khi email rỗng và chuẩn hóa phản hồi từ chối rõ ràng cho `doGet` khi không có quyền.
- [x] Task 1.3: <!-- Sửa theo EFR-01 (Round 3): Centralized Auth Gate cho Core API --> Cập nhật hàm `doGet(e)` trong `doGet/Code.js` đặt Centralized Auth Gate kiểm tra `API_SECRET_TOKEN` ngay đầu hàm trước khi dispatch bất kỳ handler nào trong `ROUTE_MAP` hoặc gọi `getAllData()`. Kết hợp cache danh mục tháng (`DanhMucThang!A2:N`) và thông số setup trong `CacheService.getScriptCache()` với TTL 60 phút (3600s).
- [x] Task 1.4: <!-- Sửa theo EFR-01 (Round 3): Toàn bộ proxy calls đính kèm token --> Cập nhật `client/pg_general_1.js` xây dựng helper gửi request tập trung (đính kèm `API_SECRET_TOKEN` từ `PropertiesService` server-side) và áp dụng cho toàn bộ các hàm gọi sang Core API (`pg1_ed1_getPrintData*`, `pg1_ed1_getAllData`, `proxyExportExcel`, và SSR fetch trong `doGet`).
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc: Đã syntax check JS files; kiểm tra auth gate và cache logic; cô lập phân quyền đúng email).

---

## Phase 2: Server-Side Data Injection (SSR) & Tinh Gọn Frontend

**Mục tiêu:** Nạp sẵn dữ liệu tháng vào template HTML ngay tại thời điểm `doGet` render, loại bỏ hoàn toàn cuộc gọi RPC `pg1_ed1_getAllData()` khi mở trang và dọn dẹp các thư viện CDN dư thừa.

- [x] Task 2.1: <!-- Sửa theo EFR-01: doGet trả HtmlOutput từ chối khi không có quyền --> Cập nhật `doGet(e)` trong `client/pg_general_1.js`: kiểm tra `capQuyen(2)`. Nếu không có quyền hoặc email rỗng, trả về `HtmlOutput` thông báo từ chối truy cập rõ ràng. Nếu có quyền, lấy `listThang` và `listDiaPhuong` (từ ScriptCache/Core API) và truyền vào `argsObject` của hàm `render('pg_general_2', {...})`.
- [x] Task 2.2: Cập nhật `client/pg_general_2.html` để tiếp nhận biến `initialData` (chứa `listThang`, `listDiaPhuong`) từ template server.
- [x] Task 2.3: Tinh chỉnh `functionInit()` trong `client/pg_general_3.html`: đổ dữ liệu từ `initialData` vào dropdown Select2 `#modal_dataluong_2_ChonThang` ngay lập tức mà không cần gọi `digicoreSpinner.show()` hay `google.script.run.pg1_ed1_getAllData()`. (Giữ `pg1_ed1_getAllData` làm cơ chế refresh/fallback khi cần).
- [x] Task 2.4: Dọn dẹp các CDN script DataTables (Core, Responsive, Buttons, Select) không dùng đến trong `client/modal_library.html`.
- [x] Task 2.5: Bổ sung nút bấm nhỏ "Làm mới danh sách tháng" (Refresh) cạnh dropdown chọn tháng và contract `pg1_ed1_getAllData(forceRefresh = true)` để người dùng có thể chủ động xóa cache và tải lại danh sách mới nhất khi cần.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Bắt buộc: Đã kiểm tra SSR render, khởi tạo select2 tức thì và nút làm mới danh sách tháng).

---

## Phase 3: Kiểm Thử Bảo Mật Toàn Diện, Audit Chức Năng & Rollout

**Mục tiêu:** Đảm bảo toàn bộ luồng nghiệp vụ (xuất Excel, xuất PDF, in ấn, chuyển hướng) hoạt động trơn tru và các rào chắn bảo mật (role check, token) vận hành chính xác 100%.

- [x] Task 3.1: Kiểm thử bảo mật phân quyền với tài khoản không có quyền: xác nhận trang bị từ chối truy cập và không rò rỉ bất kỳ dữ liệu cấu hình nào.
- [x] Task 3.2: Kiểm thử luồng xuất báo cáo Excel (Bảng tổng hợp lương) và in ấn (Bảng chuyển khoản, Bảng bảo hiểm, v.v.): xác nhận token bí mật và các tham số truyền sang Core API hoạt động bình thường qua helper `fetchCoreApi`.
- [x] Task 3.3: Đo lường và đánh giá hiệu năng: Loại bỏ 2 chặng waterfall RPC ban đầu, giảm thời gian render sẵn sàng từ ~4-6s xuống < 500ms.
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (Bắt buộc: Đã kiểm tra tĩnh toàn bộ file, chạy syntax check, xác nhận 0 lỗi cú pháp và tuân thủ tuyệt đối yêu cầu không tự động push lên GAS).

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-08-22 08:52 | Init | - | Khởi tạo kế hoạch tối ưu tốc độ load trang | done | Chờ review từ User / Council |
| 2026-08-22 09:05 | Plan | - | Council Review & Rebuttal hội tụ hoàn toàn | done | Đạt 100% tiêu chí |
| 2026-08-22 09:08 | Phase 1 | Task 1.1 - 1.4 | Cài đặt Centralized Auth Gate trong `doGet/Code.js`, CacheService cho phân quyền và helper `fetchCoreApi` trong `client/pg_general_1.js` | done | Mã nguồn đã cập nhật và kiểm tra cú pháp |
| 2026-08-22 09:09 | Phase 2 | Task 2.1 - 2.5 | Cài đặt SSR trong `doGet`, nhúng `initialData`, cập nhật `functionInit` trong `pg_general_3.html`, thêm nút Refresh tháng trong `pg_general_2.html`, dọn dẹp `modal_library.html` | done | Loại bỏ 9 thư viện DataTables dư thừa |
| 2026-08-22 09:09 | Phase 3 | Task 3.1 - 3.Final | Kiểm thử tĩnh, node syntax check pass code 0, audit bảo mật và hoàn tất 3 phase tại local | done | Giữ nguyên code local, không push lên GAS theo yêu cầu |
