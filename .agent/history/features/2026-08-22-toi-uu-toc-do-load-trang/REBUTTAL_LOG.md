# Rebuttal Log: toi-uu-toc-do-load-trang

## Round 1 - 2026-08-22T09:01:00+07:00

### Tổng kết
- EFR: 2 (accepted: 2, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `FEATURE_PLAN.md:15-100`, `FEATURE_TASKS.md:18-40`, `client/pg_general_1.js:1-125`, `doGet/Code.js:73-222`

### EFR Đã Chấp Nhận
- **[EFR-01]: Nhánh từ chối quyền của Client `doGet` không trả response**
  - **Sửa**: Đã cập nhật `FEATURE_PLAN.md` (Scope mục 2) và `FEATURE_TASKS.md` (Task 1.2, Task 2.1, Task 2.Final) yêu cầu `doGet` trả về `HtmlOutput` thông báo từ chối truy cập rõ ràng và an toàn khi `capQuyen(2)` là false hoặc email rỗng, thay vì rơi vào `undefined`/trang trắng.
- **[EFR-02]: Default Core API (`getAllData`) cần bảo vệ bằng `API_SECRET_TOKEN`**
  - **Sửa**: Đã cập nhật `FEATURE_PLAN.md` (Scope mục 3) và `FEATURE_TASKS.md` (Task 1.3, Task 1.4, Task 1.Final) yêu cầu endpoint mặc định `getAllData()` tại `doGet/Code.js` phải xác thực `API_SECRET_TOKEN`, và Client Proxy `client/pg_general_1.js` lấy token từ `PropertiesService` server-side để truyền kèm request `UrlFetchApp.fetch` bảo vệ toàn diện ranh giới service-to-service.

### EFR Đã Bác Bỏ
- Không có.

### EFR Chưa Kết Luận
- Không có.

### Phát Hiện Bổ Sung (SFR)
- Không có phát hiện bổ sung.

### Vùng đã scan khi không có SFR
- `client/pg_general_1.js:1-125`: Đã kiểm tra luồng phân quyền và proxy token.
- `doGet/Code.js:73-230`: Đã kiểm tra routing và xác thực token.
- `client/modal_library.html:1-44`: Đã kiểm tra loại bỏ script DataTables không dùng.

---

## Round 2 - 2026-08-22T09:05:00+07:00

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `FEATURE_PLAN.md:25-60`, `FEATURE_TASKS.md:18-50`, `doGet/Code.js:73-222`, `client/pg_general_1.js:1-260`

### EFR Đã Chấp Nhận
- **[EFR-01 (Round 3 Codex)]: Thiết lập Centralized Auth Gate cho toàn bộ Core API routes**
  - **Sửa**: Đã mở rộng `FEATURE_PLAN.md` (Scope mục 3) và `FEATURE_TASKS.md` (Task 1.3, Task 1.4, Task 1.Final). Thay vì chỉ kiểm tra token ở `exportTongHopExcel` hay `getAllData()`, chuyển thành Centralized Auth Gate ngay đầu hàm `doGet(e)` trong `doGet/Code.js` để xác thực `API_SECRET_TOKEN` trước khi dispatch bất kỳ handler nào trong `ROUTE_MAP`. Đồng thời, chuẩn hóa toàn bộ các hàm proxy trong `client/pg_general_1.js` đều tự động lấy token từ `PropertiesService` server-side và đính kèm vào mọi request `UrlFetchApp.fetch`.

### EFR Đã Bác Bỏ
- Không có.

### EFR Chưa Kết Luận
- Không có.

### Phát Hiện Bổ Sung (SFR)
- Không có phát hiện bổ sung.

### Vùng đã scan khi không có SFR
- `doGet/Code.js:73-222`: Kiểm tra toàn bộ danh sách `ROUTE_MAP` và cơ chế centralized token gate.
- `client/pg_general_1.js:129-264`: Kiểm tra toàn bộ các hàm proxy gọi sang Core API.
