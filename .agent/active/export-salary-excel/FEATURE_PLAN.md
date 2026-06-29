# Feature Plan: Xuất dữ liệu lương ra Excel theo tháng

> **Trạng thái**: ✅ ĐỒNG Ý (Đã chốt)
> **Review gate**: Đã chốt luồng tải XLSX an toàn qua Blob Base64, dùng Advanced Drive Service. Sẵn sàng triển khai.
> **Feature slug**: export-salary-excel
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-05-27

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Tại màn hình quản trị chính, sau khi người dùng chọn một Tháng cụ thể, họ cần xuất toàn bộ dữ liệu tổng hợp về nhân sự và lương của tháng đó.
- **Vấn đề cần giải quyết:** Dữ liệu nằm phân tương tán ở 6 nguồn khác nhau. Cần có một chức năng gom các dữ liệu này lại thành một báo cáo duy nhất theo từng mã nhân sự.
- **Mục tiêu:** Tạo API và giao diện nút bấm để xuất ra một file Excel (.xlsx) tổng hợp chứa đủ 49 cột thông tin đã được nối (Join) và cộng dồn (Sum) chính xác theo Mã nhân sự.
- **Kết quả mong đợi:** Người dùng bấm "Xuất Excel", tải về thành công file chứa 49 cột dữ liệu chuẩn xác của tháng và khu vực hiện tại.

## 2. Phạm vi

- Bổ sung tuỳ chọn lọc Khu vực (Hà Nội / Phú Thọ / Tất cả) trên UI. Logic backend chỉ lọc khu vực từ danh sách gốc `DataChotNSThang` (cùng với tháng). Các nguồn phụ trợ (Lương 1, Lương 2, v.v...) không lọc khu vực mà chỉ join vào danh sách gốc.
- Xử lý ghép nối các nguồn dữ liệu bằng `Mã nhân sự` / `Mã CB`. Các bản ghi ở nguồn phụ không khớp mã danh sách gốc sẽ bị loại nhưng ghi log cảnh báo (Warnings count).
- Xử lý cộng dồn (Sum) số tiền cho các dòng trùng Mã nhân sự trong các file Truy thu/lĩnh với hàm parser tiền chuẩn (xử lý định dạng dấu phẩy/chấm VN).
- Định dạng xuất bắt buộc là `.xlsx`. Do GAS không có thư viện ghi XLSX native trên memory, sẽ áp dụng giải pháp: Tạo bảng Spreadsheet tạm (per request) -> Fetch url `export?format=xlsx` thành Blob bằng OAuth token -> Convert thành Base64 -> Xóa ngay file Spreadsheet tạm trong khối `finally`.
- Trả về JSON `{ status: 'success', filename, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', base64, warnings }` để client tự decode và tải. Không bao giờ trả URL Drive cho client (không dùng `window.open`, không share quyền file).
- Đảm bảo cơ chế Authorization an toàn: Client browser KHÔNG gọi thẳng API `doGet`. Client dùng `google.script.run` gọi hàm proxy ở server-side `client/pg_general_1.js`. Hàm này check `userRole()` nội bộ, nếu OK sẽ tự dùng `UrlFetchApp` lấy secret từ `PropertiesService` để gọi `doGet`.
- Validate header của TỪNG file nguồn đầu vào theo đúng cấu trúc schema riêng biệt (ví dụ: DataChotNSThang có bao nhiêu cột, DataLuong1 có bao nhiêu cột) thay vì validate 46 cột đầu ra. Normalize chuỗi tháng về định dạng chuẩn của hệ thống (VD: `T03.2026`).

### Out of scope
- Sửa đổi dữ liệu gốc trong các bảng.
- Hiển thị bảng dữ liệu 46 cột này trên màn hình Web (chỉ cần xuất file).

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** Sử dụng kiến trúc API `doGet` điều hướng qua tham số `type` để xuất báo cáo.
- **"Cấm kỵ" cần tránh:** Hạn chế dùng `.find()` hoặc `.filter()` lồng trong vòng lặp lớn để join dữ liệu vì dễ gây timeout (GAS giới hạn 6 phút). Phải chuyển các sheet data thành Object/Map/Dictionary để tra cứu `O(1)`.
- **Ràng buộc kiến trúc liên quan:** Phải lấy đúng cấu trúc cột như yêu cầu và không làm phá vỡ logic các báo cáo đang có.

## 4. Giả định và câu hỏi mở

### Giả định
- Định dạng xuất bắt buộc là `.xlsx`; không có CSV fallback; không trả URL Drive cho client.
- Thư viện hoặc phương pháp tạo Excel có sẵn trong `doGet_function.js` (hoặc có thể tạo tạm qua Drive rồi lấy URL export của Google Sheets, sau đó xóa vĩnh viễn file nháp).
- Quyền truy cập các file Truy Thu Lĩnh (được cung cấp bằng ID) đã được mở cho script thực thi.

### Câu hỏi mở
- (Không còn câu hỏi mở nào)

## 5. Acceptance Criteria

- [ ] UI cho phép chọn Tháng và Khu vực (Tất cả, Hà Nội, Phú Thọ) và hiển thị nút "Xuất Excel".
- [ ] Dữ liệu kết quả được lọc đúng theo Tháng và Khu vực chỉ dựa trên cột Khu vực của `DataChotNSThang`. Các sheet khác chỉ join dữ liệu.
- [ ] Browser frontend gọi proxy qua `google.script.run`, proxy check `userRole()` rồi mới gọi `doGet` với Token. Browser không giữ Token.
- [ ] Hàm bắt buộc kiểm tra (Validate) header của từng sheet nguồn đầu vào đúng schema riêng biệt của nó.
- [ ] File tải về đúng định dạng `.xlsx`. Dữ liệu được trả 100% qua chuỗi Base64 trên memory JSON payload. File Spreadsheet nháp trên Drive bị xóa lập tức trong cùng request backend, không để lại rác, không rò rỉ URL gốc.
- [ ] Parser tiền tệ đúng với mọi định dạng số/chuỗi của Việt Nam. Cột sum TTTL hoạt động chuẩn xác.
- [ ] Console nhận được response log `warnings count` cho số lượng nhân sự bị lệch mã.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `client/pg_general_2.html` | Sửa | Thêm nút "Xuất Excel" vào UI màn hình chính | 🟢 | Chưa |
| `client/pg_general_4.html` | Sửa | Gọi `google.script.run` tới hàm proxy, nhận base64 XLSX và sinh file download | 🟢 | Chưa |
| `client/pg_general_1.js` | Sửa | Thêm hàm proxy: check userRole(), lấy secret, fetch doGet | 🟡 | Có |
| `doGet/Code.js` | Sửa | Đăng ký route mới vào `ROUTE_MAP`. Thêm check secret Token. | 🔴 | Có |
| `doGet/doGet_tongHopExcel.js` | Tạo | Logic tổng hợp, sinh file Excel nháp, lấy blob, convert Base64, xóa file nháp | 🔴 | Không |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** 
  - Khả năng xử lý: Quá trình tạo file nháp, fetch URL export, rồi xóa có thể tốn thời gian. Cần bọc `try...finally` cẩn thận để đảm bảo file luôn bị xóa dù quá trình fetch có lỗi.
  - Sai số liệu do thiếu cột ở input: `requireColumns` phải được chạy cho từng input sheet.
- **Review focus areas:** 4 Contract quan trọng: Proxy Auth, Payload JSON Base64 XLSX (không URL public), Quy trình dọn dẹp file Spreadsheet nháp per request, và logic filter Khu vực tại backend chỉ áp dụng cho DataChotNSThang.
- **Known pitfalls / historical issues:** `appsscript.json` đang để `ANYONE_ANONYMOUS`, nếu frontend gọi api thẳng không proxy token sẽ lộ dữ liệu.
- **Dependencies / rollout concerns:** Các hàm normalize như `normalizeMonthKey` và `normalizeLocation` phải đồng nhất ở cả 6 nguồn dữ liệu (nếu có trường tương ứng).

## 8. Chiến lược triển khai

- **Phase strategy:** 
  - **Phase 1: Data Builder & Validation:** Tạo hàm `buildTongHopSalaryExcelData(monthStr, location)` trả về `{headers, rows, warnings}`. Hàm gốc `DataChotNSThang` đã filter theo `month` và `location`. Validate header từng nguồn.
  - **Phase 2: Backend Export XLSX Base64 & Auth API:** Đăng ký router, check Secret Token tại doGet. Tạo Spreadsheet nháp bằng code (cấp per request), ghi Data, Fetch XLSX Blob, Convert sang Base64, và chạy `finally` Xóa file nháp. Trả JSON.
  - **Phase 3: Proxy Auth & Frontend Handler:** Viết hàm proxy ở `pg_general_1.js` (check quyền -> fetch doGet). Sửa UI `pg_general_2.html`. Sửa `pg_general_4.html` gọi proxy lấy base64 XLSX để tải file.
- **Thứ tự triển khai:** Phase 1 -> Phase 2 -> Phase 3.
- **Điểm cần phối hợp:** Test dữ liệu tổng hợp và test chặn quyền API.

## 9. Test Strategy

- **Automated tests:** Chạy script local test mảng 2D đầu ra trước khi tạo file Excel.
- **Manual verification:**
  - Vào giao diện, chọn tháng 03/2026.
  - Bấm xuất, mở file đếm đủ 46 cột.
  - Đối chiếu ngẫu nhiên 2 nhân sự: 1 người bình thường và 1 người có truy thu lĩnh xem tổng tiền có đúng không.

## 10. Rollback Plan

- Xóa route xuất file trong `Code.js` và ẩn/xóa nút Export ở UI nếu xảy ra lỗi nghiêm trọng.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`

### Danh sách thiết kế 49 cột cần xuất:
*Ghi chú: Lấy chính xác header được liệt kê theo thứ tự*

**Từ DataChotNSThang (9 cột) + Master DataNhanSu (2 cột):**
1. Kỳ lương
2. Mã nhân sự
3. Họ tên
4. Loại hợp đồng
5. Mã đơn vị
6. Tên đơn vị
7. Mã ngạch
8. Trạng thái
9. Khu vực
10. Số tài khoản (định dạng text)
11. Ngân hàng (định dạng text)

**Từ DataLuong1 (25 cột):**
12. HS bậc
13. HS bậc BL
14. HS chức vụ
15. TL vượt khung
16. HS vượt khung
17. TL ngành
18. HS ngành
19. TL thâm niên
20. HS thâm niên
21. HS độc hại
22. HS trách nhiệm
23. HS tự vệ
24. Tổng hệ số
25. Lương CĐ
26. Tổng lương
27. BHXH
28. BHYT
29. BHTN
30. KPCĐ
31. Nước ngoài
32. Nghỉ BHXH
33. Trừ khác
34. Tổng giảm trừ
35. Bảo hiểm trả chính (bằng cột Nghỉ BHXH)
36. Tổng lương 1

**Từ DataLuong2 (10 cột):**
37. Ổn định thu nhập
38. Quản lý
39. Hỗ trợ hành chính phục vụ
40. Thu hút lao động
41. Hỗ trợ khác
42. Tạm ứng nghiên cứu sinh
43. Tạm trừ thuế
44. Quyết toán thuế
45. Lương 2
46. Tạm giữ

**Từ DataAnCa (1 cột):**
47. Ăn ca

**Từ Truy thu lĩnh (2 cột):**
48. TTTL L1
49. TTTL L2
