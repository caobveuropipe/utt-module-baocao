# Feature Plan: Tối Ưu Tốc Độ Load Trang & Khởi Tạo Giao Diện

> **Trạng thái**: ✅ ĐỒNG Ý  
> **Review gate**: Đã thông qua Hội đồng Review kỹ thuật (Council Review Pass 1)  
> **Feature slug**: toi-uu-toc-do-load-trang  
> **Tạo bởi**: feature-plan  
> **Ngày tạo**: 2026-08-22  

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại, khi người dùng mở trang quản trị `Dikhobac` (`client/pg_general_2.html`), hệ thống trải qua một chuỗi xử lý thác nước đa chặng (Multi-hop Waterfall): `doGet` mở sheet phân quyền -> Render HTML rỗng -> Browser `window.load` -> Gọi `google.script.run.pg1_ed1_getAllData()` -> Proxy `pg_general_1.js` mở lại sheet phân quyền lần 2 -> Gọi `UrlFetchApp.fetch(url_api_doGet)` sang Core API -> Core API đọc Sheets -> Trả dữ liệu về để khởi tạo Select2.
- **Vấn đề cần giải quyết:**
  1. Người dùng phải chờ từ 3s – 6s với màn hình loading xoay tròn chỉ để lấy danh sách tháng và thông số khởi tạo.
  2. Sheet phân quyền `PermissionRole` bị đọc 2 lần qua hàm chậm `SpreadsheetApp.openById` trong mỗi phiên tải trang.
  3. Tải dư thừa 9 file thư viện DataTables (CSS/JS) từ nhiều CDN trên trang chủ điều hướng dù trang này không dùng DataTables.
- **Mục tiêu:**
  1. Giảm thời gian hiển thị giao diện sẵn sàng (Time to Interactive) từ ~4-6s xuống **dưới 1s**.
  2. Loại bỏ hoàn toàn trạng thái màn hình chờ khởi tạo (Zero Initial Spinner Delay).
  3. **Bảo mật tuyệt đối**: Đảm bảo phân quyền (Permissions), token bảo mật (`API_SECRET_TOKEN`), và kiểm tra session người dùng không bị lỏng lẻo hay bypass khi áp dụng Cache.
- **Kết quả mong đợi:** Người dùng mở link là trang hiển thị ngay lập tức với danh sách tháng đã được nạp sẵn vào dropdown Select2, người dùng không có quyền sẽ bị chặn ngay từ cổng `doGet`.

---

## 2. Phạm vi

### In scope
1. **Server-Side Data Injection (SSR)**: Nạp sẵn `listThang`, `listDiaPhuong` và thông số khởi tạo ngay trong hàm `doGet` tại `client/pg_general_1.js` và inject trực tiếp vào template `pg_general_2.html`.
2. **Cơ chế Cache phân quyền an toàn (`CacheService`)**:
   - Cache kết quả phân quyền theo User Email (`CacheService.getUserCache()` hoặc `CacheService.getScriptCache()` với key gắn email băm/prefix `perm_${email}`) trong thời hạn 15–30 phút.
   - Thêm cơ chế bypass cache / xóa cache khi cần.
   - <!-- Sửa theo EFR-01: Thêm nhánh xử lý từ chối rõ ràng và an toàn cho doGet khi không có quyền hoặc email rỗng -->
   - Chuẩn hóa response từ chối tại `client/pg_general_1.js#doGet` trả về `HtmlOutput` thông báo từ chối truy cập rõ ràng thay vì rơi vào undefined/trang trắng.
3. **Cơ chế Cache dữ liệu tĩnh & Centralized Auth Gate cho Core API (`doGet/Code.js`)**:
   - Cache danh mục tháng (`DanhMucThang!A2:N`) và thiết lập (`Setup!B2:B`) trong `CacheService.getScriptCache()` thời hạn 60 phút.
   - <!-- Sửa theo EFR-01 (Round 3): Thiết lập Centralized Auth Gate cho toàn bộ Core API routes và cập nhật toàn bộ proxy functions trong client/pg_general_1.js -->
   - Bổ sung rào chắn bảo mật tập trung (Centralized Auth Gate) ngay đầu hàm `doGet(e)` trong `doGet/Code.js` để xác thực `API_SECRET_TOKEN` trước khi dispatch bất kỳ handler nào trong `ROUTE_MAP` hoặc `getAllData()`.
   - Chuẩn hóa toàn bộ các hàm proxy trong `client/pg_general_1.js` (`pg1_ed1_*`, SSR fetch trong `doGet`, `proxyExportExcel`) luôn lấy token từ `PropertiesService` server-side và đính kèm vào mọi request gọi sang Core API.
4. **Tối ưu hóa tài nguyên Frontend (`client/modal_library.html` & `client/pg_general_3.html`)**:
   - Dọn dẹp các thư viện DataTables không dùng trên trang chủ điều hướng.
   - Nạp Select2 trực tiếp từ dữ liệu inject sẵn mà không cần gọi RPC `pg1_ed1_getAllData()` lúc mở trang (giữ lại hàm này làm fallback/refresh).

### Out of scope
- Thay đổi logic nghiệp vụ tính toán báo cáo (lương, bảo hiểm, kho bạc, hạch toán).
- Sửa đổi cấu trúc các module ThuyetMinhL1, ThuyetMinhL2.

---

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - `[2026-04-12]`: Kiến trúc 3-module (`client`, `doGet`, `doPost`) độc lập được giữ nguyên. `client/` đóng vai trò Web UI & Proxy, `doGet/` đóng vai trò API Gateway & Core Engine.
  - `[2026-06-25]`: Sử dụng Sheets API v4 (`Sheets.Spreadsheets.Values.get / batchGet`) thay vì `SpreadsheetApp` khi đọc dữ liệu bảng tính.
- **"Cấm kỵ" cần tránh:**
  - Không được bỏ qua kiểm tra quyền của User ở cả tầng Client Proxy lẫn tầng Core API.
  - Tuyệt đối không lưu token bí mật (`API_SECRET_TOKEN`) ở phía Client (HTML/JS phía trình duyệt). Token chỉ nằm ở `PropertiesService` server-side.
  - Không dùng cache chung (global cache không phân biệt user) cho dữ liệu phân quyền vì có nguy cơ User A dùng lại quyền của User B.
- **Ràng buộc kiến trúc liên quan:**
  - Các script được deploy qua `clasp` độc lập.
  - Cần đảm bảo khi mất cache hoặc cache hết hạn, hệ thống tự động fallback đọc từ Sheet gốc mà không gây lỗi ứng dụng.

---

## 4. Giả định và câu hỏi mở

### Giả định
- Danh sách tháng và hằng số thiết lập (`Setup`) thay đổi với tần suất thấp (theo tháng), nên TTL cache 60 phút là an toàn và hợp lý.
- Danh sách phân quyền `PermissionRole` thay đổi không thường xuyên, TTL cache 15 phút đủ cân bằng giữa tính phản hồi tức thì và hiệu năng.

### Câu hỏi mở
- *[Non-blocking]*: Có cần bổ sung thêm nút "Làm mới dữ liệu tháng" (Force Refresh) trên giao diện để người dùng chủ động xóa cache khi vừa mở tháng mới trong Google Sheets không? *(Đề xuất: Có, tích hợp nút refresh nhỏ cạnh dropdown chọn tháng).*

---

## 5. Acceptance Criteria

- [ ] **AC 1:** Khi truy cập trang, dropdown `#modal_dataluong_2_ChonThang` hiển thị đầy đủ danh sách các tháng làm việc ngay khi trang vừa tải xong, không xuất hiện modal spinner "Đang khởi tạo dữ liệu...".
- [ ] **AC 2:** Hàm kiểm tra phân quyền `capQuyen()` và `userRole()` giảm thời gian thực thi xuống dưới 10ms khi đã có cache trong `CacheService`.
- [ ] **AC 3:** Nếu người dùng chưa được cấp quyền `Tính lương-Xem;`, trang bị chặn hiển thị ngay từ `doGet` hoặc trả về thông báo lỗi phân quyền rõ ràng, không rò rỉ dữ liệu tháng hay cấu hình.
- [ ] **AC 4:** Các tài nguyên CDN không sử dụng (DataTables và các extension của nó) được gỡ bỏ khỏi `modal_library.html` của trang điều hướng chính, giúp giảm nhẹ tải trang.
- [ ] **AC 5:** Tất cả các chức năng in ấn, xuất Excel, xuất PDF, chuyển hướng thuyết minh hoạt động bình thường, không có bất kỳ hồi quy (regression) nào.

---

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `client/pg_general_1.js` | Sửa | Thêm CacheService cho `getDataPermission()`, fetch `listThang` từ cache/Core API trong `doGet` để inject vào template | 🟡 Trung bình | Có |
| `client/pg_general_2.html` | Sửa | Nhận biến `initialData` được inject từ server và khởi tạo UI ngay | 🟢 Thấp | Có |
| `client/pg_general_3.html` | Sửa | Cập nhật `functionInit` để ưu tiên dùng dữ liệu inject sẵn thay vì gọi RPC `pg1_ed1_getAllData()` | 🟢 Thấp | Có |
| `client/modal_library.html` | Sửa | Loại bỏ các thư viện DataTables dư thừa | 🟢 Thấp | Không |
| `doGet/Code.js` | Sửa | Thêm CacheService cho `getAllData()` để tăng tốc độ response | 🟢 Thấp | Có |

---

## 7. Risk Triage và Review Focus

- **Review required:** Yes (Khuyến nghị thực hiện `feature-review`)
- **Risk hotspots:**
  1. *Security / Cache Poisoning / Role Leak*: Đảm bảo key cache phân quyền gắn chặt với `userEmail`, không để người dùng này nhận quyền của người dùng khác.
  2. *Data Stale*: Danh sách tháng mới tạo trong Google Sheets có thể chưa xuất hiện ngay nếu chưa hết hạn cache (cần cơ chế fallback hoặc nút refresh).
  3. *Error Fallback*: Nếu `CacheService` gặp sự cố (quá dung lượng hoặc tạm ngưng), code phải tự động fallback về đọc Sheet gốc một cách trơn tru.
- **Review focus areas:**
  - Thiết kế key và TTL của `CacheService` cho phân quyền và danh mục tháng đã tối ưu và an toàn chưa?
  - Cơ chế Server-Side Injection có làm tăng thời gian xử lý ban đầu của `doGet` không? (Đảm bảo `doGet` lấy dữ liệu từ cache nên thời gian thực thi cực nhanh < 50ms).
- **Known pitfalls / historical issues:**
  - `SpreadsheetApp.openById` là thủ phạm gây nghẽn luồng đồng bộ (Synchronous I/O). Việc loại bỏ gọi hàm này lặp lại sẽ cải thiện rõ rệt trải nghiệm người dùng.

---

## 8. Chiến lược triển khai

- **Phase strategy:** 3 Phase tuần tự:
  - **Phase 1 (Backend Core & Proxy Caching)**: Cài đặt CacheService cho phân quyền (`pg_general_1.js`) và dữ liệu danh mục tháng (`doGet/Code.js`).
  - **Phase 2 (Server-Side Injection & Frontend Optimization)**: Truyền dữ liệu khởi tạo qua template `doGet`, khởi tạo Dropdown tức thì tại `pg_general_2.html` / `pg_general_3.html`, dọn dẹp `modal_library.html`.
  - **Phase 3 (Testing, Security Audit & Verification)**: Kiểm tra phân quyền đa tài khoản, đo đạc tốc độ tải trang, kiểm tra chức năng xuất/in báo cáo.
- **Thứ tự triển khai:** Phase 1 -> Phase 2 -> Phase 3.

---

## 9. Test Strategy

- **Automated / Script Tests:**
  - Test benchmark thời gian thực thi của `getDataPermission()` khi có cache vs không có cache.
  - Test kiểm tra key cache phân quyền giữa 2 email khác nhau.
- **Manual verification:**
  - Dùng tài khoản hợp lệ: Mở trang Web App, kiểm tra dropdown tháng hiển thị ngay không cần chờ spinner.
  - Dùng tài khoản không có quyền: Kiểm tra trang báo lỗi / từ chối truy cập chính xác.
  - Thực hiện xuất 1 báo cáo Excel (Bảng tổng hợp lương) và in 1 bảng chuyển khoản để xác nhận toàn bộ flow hoạt động trơn tru.
- **Data / env chuẩn bị trước khi test:**
  - 1 tài khoản có quyền `Tính lương-Xem;` và 1 tài khoản không có quyền.

---

## 10. Rollback Plan

- Nếu gặp lỗi phân quyền hoặc cache không hoạt động, revert code về các file gốc (hoặc xóa cache bằng lệnh `CacheService.getScriptCache().removeAll(...)`).
- Backup hiện tại đã sẵn sàng để khôi phục nhanh qua `clasp`.

---

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
