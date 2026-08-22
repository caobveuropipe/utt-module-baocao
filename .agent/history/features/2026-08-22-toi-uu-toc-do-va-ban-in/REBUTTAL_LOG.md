## Round 1 - 2026-08-22T09:58:00+07:00
### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `doGet/Code.js:75-95`, `client/pg_general_1.js:225-265`, `doGet/doGet_tongHopBaoHiem.js:775-810`, `FEATURE_PLAN.md`, `FEATURE_TASKS.md`

### EFR Đã Chấp Nhận
- **[EFR-01] Core API fail-open khi thiếu `API_SECRET_TOKEN`**:
  - *Evidence xác nhận:* `doGet/Code.js:83` dùng `if (validToken && reqToken !== validToken)`. Nếu `validToken` chưa cấu hình hoặc rỗng trong Script Properties, điều kiện này bypass gate.
  - *Sửa plan/tasks:* Bổ sung Task 1.2 trong `FEATURE_TASKS.md` và mục In scope trong `FEATURE_PLAN.md` đổi gate sang Fail-Closed: từ chối ngay nếu `!validToken` hoặc `reqToken !== validToken`.
- **[EFR-02] Các RPC in dữ liệu không thực thi `Tính lương-Xem` tại boundary gọi dữ liệu**:
  - *Evidence xác nhận:* `client/pg_general_1.js:229-314` gọi thẳng `fetchCoreApi` mà không qua kiểm tra `userRole()`.
  - *Sửa plan/tasks:* Bổ sung Task 4.1 trong `FEATURE_TASKS.md` tạo helper `assertUserHasPermission` chặn mọi request RPC không đủ quyền tại boundary proxy trước khi gửi token sang Core API.
- **[EFR-03] Kế hoạch chưa loại bỏ I/O file trung gian cho 7/9 luồng in HTML**:
  - *Evidence xác nhận:* `doGet/doGet_tongHopBaoHiem.js:785` và các file liên quan vẫn gọi `doGet_taoBang*` ghi file Google Sheet rồi mở lại đọc dữ liệu, gây chậm và tạo race condition.
  - *Sửa plan/tasks:* Bổ sung các Task 2.1, 2.2, 3.1, 3.2 trong `FEATURE_TASKS.md` tách biệt hàm `build*ReportData` thuần in-memory cho 100% các bản in HTML, tuyệt đối không ghi file trung gian.

### EFR Đã Bác Bỏ
- Không có.

### EFR Chưa Kết Luận
- Không có.

### Phát Hiện Bổ Sung (SFR)
- Không có phát hiện bổ sung.

### Vùng đã scan khi không có SFR
- `doGet/Code.js:75-95` [Đã kiểm tra Centralized Auth Gate]
- `client/pg_general_1.js:225-335` [Đã kiểm tra authorization boundary RPCs]
- `doGet/doGet_tongHopBaoHiem.js:775-810`, `doGet_tongHopKhoanTru.js:340-365`, `doGet_tongHopKPCD.js:300-325` [Đã kiểm tra chuỗi gọi hàm in ấn]

---

## Round 2 - 2026-08-22T10:04:00+07:00
### Tổng kết
- EFR: 2 (accepted: 2, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `doGet/doGet_function.js:45-65`, `client/pg_general_3.html:690-730`, `FEATURE_PLAN.md`, `FEATURE_TASKS.md`

### EFR Đã Chấp Nhận
- **[EFR-01] Chưa định nghĩa type/value contract khi đổi sang Sheets API, có thể biến số tiền thành 0**:
  - *Evidence xác nhận:* Sheets API v4 mặc định là `FORMATTED_VALUE`, chuỗi tiền tệ `1.234.567` qua `parseNumber` / `Number()` sẽ thành `NaN` -> `0`.
  - *Sửa plan/tasks:* Bổ sung Task 1.1 trong `FEATURE_TASKS.md` và mục In scope trong `FEATURE_PLAN.md` khóa cứng `valueRenderOption: 'UNFORMATTED_VALUE'` và `dateTimeRenderOption: 'FORMATTED_STRING'`, kèm normalize kiểu dữ liệu đầy đủ.
- **[EFR-02] Dữ liệu Sheet được chèn thẳng vào popup HTML, tạo XSS tại origin của ứng dụng**:
  - *Evidence xác nhận:* `client/pg_general_3.html:725` và các hàm render bảng in nối chuỗi HTML trực tiếp không qua escape/sanitizer.
  - *Sửa plan/tasks:* Bổ sung Task 2.3 và Task 3.3 xây dựng helper `escapeHtml(str)` và áp dụng bắt buộc cho toàn bộ giá trị động trên bản in HTML popup.

### EFR Đã Bác Bỏ
- Không có.

### EFR Chưa Kết Luận
- Không có.

### Phát Hiện Bổ Sung (SFR)
- Không có phát hiện bổ sung.

### Vùng đã scan khi không có SFR
- `doGet/doGet_function.js:45-65` [Đã kiểm tra parseNumber và type conversion]
- `client/pg_general_3.html:690-730,1460-1480` [Đã kiểm tra các vị trí render table cells không escape]
