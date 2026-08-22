# Feature Plan: Tối ưu tốc độ xử lý dữ liệu và tạo bản in (Kho Bạc & Hạch Toán)

> **Trạng thái**: ✅ ĐỒNG Ý  
> **Review gate**: Đã qua cổng review hội đồng kỹ thuật (Sẵn sàng handoff sang `feature-coordinator`)  
> **Feature slug**: `toi-uu-toc-do-va-ban-in`  
> **Tạo bởi**: feature-plan  
> **Ngày tạo**: 2026-08-22  

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Dự án Dikhobac đã tối ưu xuất sắc tốc độ tải trang chủ (SSR < 500ms). Tuy nhiên, các luồng xử lý báo cáo, hạch toán, tạo bản in và trích xuất dữ liệu đang đọc đồng bộ qua nhiều SpreadsheetApp (`SpreadsheetApp.openById`), tốn từ 10 - 25 giây cho mỗi tác vụ.
- **Vấn đề cần giải quyết:**
  1. **Độ trễ I/O cao:** Mở tuần tự 4 - 6 file Google Sheets lớn (`DataLuong1`, `DataLuong2`, `DataTruyThu1`, `DataTruyThu2`, `DataAnCa`, `Master`) gây nghẽn và có nguy cơ chạm trần timeout 6 phút của Apps Script.
  2. **Trải nghiệm in ấn & Xuất file:** Một số luồng xuất Excel/Sheet template tốn thời gian ghi Drive. Bản in HTML popup hiện tại đã rất nhanh nhưng cần đồng bộ hóa toàn bộ các bản in còn lại theo chuẩn in HTML trực tiếp (Times New Roman, phân trang ngắt trang chuẩn).
  3. **Yêu cầu an ninh & Bảo mật dữ liệu:** Tuyệt đối không để lộ lọt ID file, cấu trúc bảng lương hay dữ liệu thu nhập cán bộ ra bên ngoài; duy trì Centralized Auth Gate (`API_SECRET_TOKEN`) và Session Permission Gate.
- **Mục tiêu:** 
  - Giảm thời gian tổng hợp dữ liệu in ấn & báo cáo từ **15-20s xuống còn 2-4s** (giảm 70-80% thời gian chờ).
  - Chuẩn hóa 100% bản in sang cơ chế In HTML Popup trực tiếp (không phụ thuộc xuất file trung gian).
  - Đảm bảo tuân thủ nghiêm ngặt chuẩn bảo mật và chống lộ lọt thông tin tài chính.
- **Kết quả mong đợi:** Người dùng bấm In / Xuất các bảng (TH Lương, TH Bảo hiểm, TH Khoản trừ, TH KPCĐ, Hạch toán Bảo hiểm, Hạch toán KPCĐ, Phân bổ Lương BHXH, Hạch toán Lương & Truy lĩnh) phản hồi tức thì, chính xác 100% số liệu.

---

## 2. Phạm vi

### In scope
1. **Tối ưu tầng I/O Backend (`doGet`):**
   <!-- Sửa theo EFR-03 (Round 2): Tách hàm build*Data thuần in-memory cho 100% luồng in HTML, loại bỏ ghi/đọc Google Sheet trung gian -->
   - Tách biệt logic tính toán in-memory (`build*ReportData`) và logic xuất template Sheet/PDF cũ; toàn bộ 8 luồng in HTML gọi trực tiếp hàm in-memory, tuyệt đối không ghi qua file trung gian (`doGet_taoBang*`) để triệt tiêu độ trễ Drive và loại bỏ race condition khi in đồng thời.
   <!-- Sửa theo EFR-01 (Round 3): Khóa Type Contract UNFORMATTED_VALUE khi chuyển sang Sheets API v4 -->
   - Thay thế `SpreadsheetApp.openById().getSheetByName().getDataRange().getValues()` bằng `Sheets.Spreadsheets.Values.get` (Sheets API v4) với cấu hình bắt buộc: `valueRenderOption: 'UNFORMATTED_VALUE'`, `dateTimeRenderOption: 'FORMATTED_STRING'`, kèm normalize/padding kiểu dữ liệu (Number, String, Boolean, Date) đảm bảo tính toán số học chính xác 100% không bị NaN/0.
   - Tích hợp gom truy vấn (batch read) cho các file dữ liệu thường xuyên đọc cùng lúc.
   - Thêm lớp Cache in-memory / ScriptCache cho các bảng danh mục tĩnh (`DanhMucDonVi`, `DanhMucThang`, `Setup`).
2. **Chuẩn hóa & Tối ưu Bản in Client (`client/pg_general_3.html` & `client/pg_general_4.html`):**
   <!-- Sửa theo EFR-02 (Round 3): Chống XSS qua Output Encoding toàn bộ giá trị động trên bản in HTML -->
   - Bổ sung helper `escapeHtml` và áp dụng sanitize/escape toàn bộ các giá trị dữ liệu động (họ tên, mã CB, nội dung bổ sung, tiêu đề bảng) trước khi đưa vào template HTML popup để triệt tiêu nguy cơ Stored/Reflected XSS.
   - Đồng bộ hóa định dạng in HTML cho toàn bộ 8 loại bản in: Header trường, Bảng dữ liệu co giãn theo A4 portrait/landscape, ngắt dòng/ngắt trang `page-break-inside: avoid`, footer chữ ký chuẩn.
   - Tối ưu Payload truyền tải: Chỉ gửi các trường dữ liệu cần thiết phục vụ in/báo cáo về client, giảm kích thước JSON truyền qua mạng.
3. **Bảo mật & Chống lộ thông tin:**
   <!-- Sửa theo EFR-01 (Round 2): Chuyển Centralized Auth Gate sang Fail-Closed bắt buộc -->
   - Đổi Centralized Auth Gate sang cơ chế Fail-Closed: từ chối truy cập ngay nếu `API_SECRET_TOKEN` bị thiếu/rỗng trong Script Properties hoặc token gửi lên không khớp.
   <!-- Sửa theo EFR-02 (Round 2): Bổ sung Authorization wrapper tại Data Boundary cho toàn bộ RPC in ấn/export trên client -->
   - Bổ sung wrapper xác thực quyền `Tính lương-Xem` tại toàn bộ các hàm RPC `pg1_ed1_getPrintData*` và `proxyExportExcel` trên `client/pg_general_1.js` trước khi chuyển tiếp request sang Core API.
   - Đảm bảo toàn bộ request Service-to-Service giữa Client và Core API đều đi qua `API_SECRET_TOKEN`.
   - Không log dữ liệu nhạy cảm (họ tên, lương, tài khoản) ra client console hay Stackdriver logging công khai.

### Out of scope
- Thay đổi cấu trúc cơ sở dữ liệu trên các file Google Sheets gốc (`DataLuong1`, `DataLuong2`, `DataChotNSThang`...).
- Thay đổi logic tính toán nghiệp vụ lương L1/L2 gốc (chỉ tối ưu phương thức đọc và tổng hợp).

---

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - `[2026-06-25]`: Bắt buộc sử dụng Sheets Advanced Service (Sheets API v4) thay thế cho `SpreadsheetApp` khi đọc dữ liệu quy mô lớn.
  - `[2026-08-22]`: Duy trì kiến trúc Centralized Auth Gate (`API_SECRET_TOKEN`) và Cache 2 lớp (Shared vs User-isolated).
  - Tách biệt 3 module `client`, `doGet`, `doPost`.
- **"Cấm kỵ" cần tránh:**
  - Không expose trực tiếp URL/Token của Core API hoặc các file Sheets bí mật ra mã nguồn client-side public.
  - Không hardcode thông tin nhạy cảm vào mã nguồn JavaScript gửi về trình duyệt.
  - Tuyệt đối không thay đổi thứ tự hay tên cột dữ liệu gây sai lệch báo cáo kế toán.

---

## 4. Giả định và câu hỏi mở

### Giả định
- `Sheets API v4` đã được bật sẵn (`enabledAdvancedServices` trong `appsscript.json` của `doGet`).
- Tất cả người dùng thao tác đều có tài khoản email nội bộ thuộc danh sách phân quyền của trường.

### Câu hỏi mở
- *Non-blocking:* Các bản in Hạch toán hiện tại (Phân bổ lương BHXH, Hạch toán lương & truy lĩnh) người dùng muốn ưu tiên in khổ Giấy Ngang (Landscape) hay Dọc (Portrait)? (Mặc định: Phân bổ Lương & Hạch toán lương dùng Landscape do nhiều cột, TH Khoản trừ & KPCĐ dùng Portrait).

---

## 5. Acceptance Criteria

- [ ] Thời gian xử lý lấy dữ liệu in cho mỗi bản in giảm >= 60% (thực tế dưới 4 giây).
- [ ] 100% các bản in (TH Lương, TH Bảo Hiểm, TH Khoản Trừ, TH KPCĐ, TH CK, Hạch toán BH, Hạch toán KPCĐ, Phân bổ BHXH, Hạch toán Lương & Truy lĩnh) mở popup in HTML tức thì, định dạng A4 chuẩn, không bị cắt dòng/trang lỗi.
- [ ] Mọi API lấy dữ liệu đều được bảo vệ bởi Token Secret và kiểm tra quyền tài khoản.
- [ ] Không có bất kỳ URL file nhạy cảm nào bị lộ lọt qua console client.
- [ ] Khớp số liệu 100% với báo cáo hiện tại khi đối chiếu chéo.

---

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `doGet/doGet_function.js` | Sửa | Thêm helper `fastReadSheetValues(fileId, sheetName, range)` dùng Sheets API v4 | 🟡 Thấp | Có |
| `doGet/doGet_tongHopLuong.js` | Sửa | Tối ưu luồng đọc dữ liệu tổng hợp lương bằng Sheets API | 🟡 Trung bình | Có |
| `doGet/doGet_tongHopBaoHiem.js` | Sửa | Tối ưu luồng đọc dữ liệu bảo hiểm | 🟡 Trung bình | Có |
| `doGet/doGet_tongHopKPCD.js` | Sửa | Tối ưu luồng đọc dữ liệu KPCĐ | 🟡 Trung bình | Có |
| `doGet/doGet_tongHopKhoanTru.js` | Sửa | Tối ưu luồng đọc dữ liệu khoản trừ | 🟡 Trung bình | Có |
| `doGet/doGet_tongHopCk.js` | Sửa | Tối ưu luồng gom dữ liệu chuyển khoản / treo lương | 🟡 Trung bình | Có |
| `doGet/doGet_hachToanBaoHiem.js` | Sửa | Tối ưu luồng hạch toán bảo hiểm | 🟡 Trung bình | Có |
| `doGet/doGet_hachToanKPCD.js` | Sửa | Tối ưu luồng hạch toán KPCĐ | 🟡 Trung bình | Có |
| `doGet/doGet_phanBoLuongBHXH.js` | Sửa | Tối ưu luồng phân bổ lương BHXH | 🟡 Trung bình | Có |
| `doGet/doGet_hachToanLuongVaTruyLinh.js` | Sửa | Tối ưu luồng hạch toán lương & truy lĩnh | 🟡 Trung bình | Có |
| `client/pg_general_3.html` | Sửa | Tối ưu CSS in ấn, hoàn thiện render popup HTML cho các bản in | 🟡 Thấp | Có |
| `client/pg_general_4.html` | Sửa | Đồng bộ hóa gọi hàm in ấn popup, xử lý UI chọn địa phương | 🟡 Thấp | Có |

---

## 7. Risk Triage và Review Focus

- **Review required:** Yes (Bắt buộc trước khi thực thi)
- **Risk hotspots:**
  - Tầng đọc dữ liệu Sheets API: Cần đảm bảo index mảng trả về từ `Sheets.Spreadsheets.Values.get` xử lý đúng trường hợp các ô cuối rỗng (trailing empty cells).
  - Phân quyền & Bảo mật token: Đảm bảo không bypass token gate và không gửi payload dư thừa.
- **Review focus areas:**
  1. Tính toàn vẹn của mảng dữ liệu lương/bảo hiểm khi chuyển từ `SpreadsheetApp` sang `Sheets.Spreadsheets.Values.get`.
  2. Tính tương thích của CSS bản in trên các trình duyệt khác nhau (Chrome, Edge, Cốc Cốc) khi in hoặc xuất PDF qua trình duyệt.
  3. Khả năng chống lộ lọt thông tin cá nhân/tài chính cán bộ.

---

## 8. Chiến lược triển khai

- **Phase strategy:**
  - **Phase 1 (Backend Core Reader Optimization):** Viết helper đọc nhanh bằng Sheets API v4 và chuyển đổi các luồng đọc dữ liệu trong `doGet`.
  - **Phase 2 (Nhóm Báo Cáo & Bản In Đi Kho Bạc):** Tối ưu và chuẩn hóa in ấn cho Bảng TH Lương, TH Bảo Hiểm, TH Khoản Trừ, TH KPCĐ, TH CK.
  - **Phase 3 (Nhóm Báo Cáo & Bản In Hạch Toán):** Tối ưu và chuẩn hóa in ấn cho Hạch toán BH, Hạch toán KPCĐ, Phân bổ BHXH, Hạch toán Lương & Truy Lĩnh.
  - **Phase 4 (Security Audit & E2E Verification):** Rà soát an ninh, đối chiếu khớp số liệu 100%, deploy & nghiệm thu.

---

## 9. Test Strategy

- **Automated / Helper Tests:**
  - Tạo các hàm test unit độc lập trong `doGet` (ví dụ: `test_fastRead`, `test_compareOldVsNewSpeed`) để đo benchmark thời gian và so khớp output JSON.
- **Manual Verification:**
  - Mở giao diện Web, chọn tháng thực tế (ví dụ: `T01.2025` hoặc kỳ hiện tại).
  - Bấm In từng bản in -> Kiểm tra popup mở ra trong < 3s, số liệu các cột, tổng cộng, dòng ký khớp 100% so với bản in cũ.
  - Thử nghiệm tài khoản không có quyền -> Đảm bảo bị chặn và không lấy được dữ liệu.

---

## 10. Rollback Plan

- Dự án có hệ thống backup tự động timestamped qua `push-all.ps1` và `deploy-all.ps1`. Nếu phát sinh lỗi, khôi phục lại phiên bản backup gần nhất bằng `clasp push` từ thư mục backup.

---

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
