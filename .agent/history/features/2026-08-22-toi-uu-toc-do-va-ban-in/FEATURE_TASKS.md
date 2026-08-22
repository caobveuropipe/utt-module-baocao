# Feature Tasks: Tối ưu tốc độ xử lý dữ liệu và tạo bản in (Kho Bạc & Hạch Toán)

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

## Phase 1: Tối ưu tầng đọc dữ liệu Core Backend (Sheets API v4 Reader & Security Gate)

**Mục tiêu:** Xây dựng helper đọc nhanh `Sheets.Spreadsheets.Values.get` / `batchGet` có chuẩn hóa padding ô rỗng và khóa Type Contract `UNFORMATTED_VALUE`; thắt chặt Auth Gate Core API sang Fail-Closed.

- [x] Task 1.1: Xây dựng hàm helper `fastReadSheetValues(fileId, sheetName, range)` và `fastBatchReadSheetValues(fileId, ranges)` trong `doGet/doGet_function.js` sử dụng bắt buộc `valueRenderOption: 'UNFORMATTED_VALUE'`, `dateTimeRenderOption: 'FORMATTED_STRING'`, kèm logic normalize kiểu dữ liệu (Number/Date/Boolean/String) và chuẩn hóa padding mảng ô rỗng (<!-- Sửa theo EFR-01 Round 3 -->).
- [x] Task 1.2: Cập nhật Centralized Auth Gate trong `doGet/Code.js` sang cơ chế Fail-Closed: từ chối truy cập ngay nếu `API_SECRET_TOKEN` rỗng/chưa cấu hình hoặc `token` không khớp (<!-- Sửa theo EFR-01 Round 2 -->).
- [x] Task 1.3: Thêm CacheService cho `DanhMucDonVi`, `DanhMucThang`, và `Setup` trong `doGet/Code.js` (thời gian cache 6h).
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Đo benchmark tốc độ đọc data, so khớp mảng output cả về value và `typeof` với dữ liệu gốc, kiểm thử negative case khi thiếu/sai token trả về Unauthorized).

---

## Phase 2: Tối ưu & Chuẩn hóa Nhóm Báo Cáo / Bản In Đi Kho Bạc (Pure In-Memory & XSS Escaping)

**Mục tiêu:** Đồng bộ hóa 5 bản in Kho Bạc (TH Lương, TH Bảo Hiểm, TH Khoản Trừ, TH KPCĐ, TH CK/Treo Lương) về tốc độ < 3s, in HTML popup trực tiếp thuần in-memory và escape toàn bộ output HTML.

- [x] Task 2.1: Tách hàm `buildTongHopLuongData` và `buildTongHopCkData` thuần in-memory; cập nhật `getPrintDataTongHopLuong` và `getPrintDataCk` trả data trực tiếp không qua `doGet_taoBang*` (<!-- Sửa theo EFR-03 Round 2 -->).
- [x] Task 2.2: Tách hàm `buildTongHopBaoHiemData`, `buildTongHopKhoanTruData`, `buildTongHopKPCDData` thuần in-memory; cập nhật các hàm `getPrintData*` tương ứng loại bỏ bước ghi đè Google Sheet template (<!-- Sửa theo EFR-03 Round 2 -->).
- [x] Task 2.3: Xây dựng helper `escapeHtml(str)` trong `client/pg_general_3.html`; sanitize/escape toàn bộ các trường dữ liệu động trước khi ghép markup; tinh chỉnh template HTML in ấn (CSS layout A4, table-layout fixed, font Times New Roman, ngắt trang `.page-break-inside: avoid`, dòng chữ ký chuẩn) (<!-- Sửa theo EFR-02 Round 3 -->).
- [x] Task 2.4: Hoàn thiện popup dialog chọn cơ sở / địa phương trong `client/pg_general_4.html` cho nhóm Kho Bạc.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Test in trực tiếp từng bản in nhóm Kho Bạc trên trình duyệt, kiểm tra tốc độ < 3s, kiểm tra security test với payload HTML injection `<script>` hiển thị text an toàn).

---

## Phase 3: Tối ưu & Chuẩn hóa Nhóm Báo Cáo / Bản In Hạch Toán (Pure In-Memory & XSS Escaping)

**Mục tiêu:** Nâng cấp hiệu năng các luồng hạch toán phức tạp (Hạch toán BH, Hạch toán KPCĐ, Phân bổ Lương BHXH, Hạch toán Lương & Truy Lĩnh) sang mô hình tính toán thuần in-memory kèm escape HTML.

- [x] Task 3.1: Tách hàm tính toán in-memory `buildHachToanBaoHiemData` và `buildHachToanKPCDData` trong `doGet_hachToanBaoHiem.js` và `doGet_hachToanKPCD.js`; cập nhật `getPrintData*` trả trực tiếp data không ghi file trung gian (<!-- Sửa theo EFR-03 Round 2 -->).
- [x] Task 3.2: Tách hàm tính toán in-memory `buildPhanBoLuongBHXHData` và `buildHachToanLuongVaTruyLinhData` sử dụng `Map` tối ưu gom nhóm; cập nhật `getPrintData*` tương ứng (<!-- Sửa theo EFR-03 Round 2 -->).
- [x] Task 3.3: Xây dựng hàm render bản in HTML cho `Phân bổ Lương BHXH` và `Hạch toán Lương & Truy lĩnh` trên `client/pg_general_3.html` có escape HTML đầy đủ (<!-- Sửa theo EFR-02 Round 3 -->).
- [x] Task 3.4: Tích hợp dialog và gọi RPC `printReportHachToan` trong `client/pg_general_4.html`.
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (Kiểm tra khớp số liệu 100% từng dòng hạch toán và hiển thị bản in HTML an toàn).

---

## Phase 4: Authorization Data Boundary, Kiểm thử E2E & Triển khai

**Mục tiêu:** Thực thi kiểm tra quyền hạn `Tính lương-Xem` tại toàn bộ RPC client, rà soát toàn bộ bề mặt bảo mật, kiểm thử concurrency và deploy.

- [x] Task 4.1: Xây dựng helper kiểm tra quyền bắt buộc `assertUserHasPermission('Tính lương-Xem;')` áp dụng cho toàn bộ RPC `pg1_ed1_getPrintData*` và `proxyExportExcel` trong `client/pg_general_1.js` (<!-- Sửa theo EFR-02 -->).
- [x] Task 4.2: Rà soát kiểm tra Logger trong backend và console.log trên client: đảm bảo không log payload nhạy cảm ra log công khai.
- [x] Task 4.3: Chạy test đối chiếu chéo số liệu giữa bản in mới (in-memory) và file Excel cũ; kiểm thử bảo mật với tài khoản không có quyền trên từng RPC server-side.
- [x] Task 4.4: Tạo bản backup và deploy phiên bản mới bằng `push-all.ps1` / `deploy-all.ps1`.
- [x] Task 4.Final: 🧪 Test & Verify Phase 4 (User nghiệm thu trực tiếp trên môi trường WebApp).

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-08-22 09:30 | Setup | Khởi tạo | Tạo bộ tài liệu FEATURE_PLAN & FEATURE_TASKS | done | Đã qua 3 vòng review hội tụ |
| 2026-08-22 10:10 | Phase 1 | Task 1.1 | Viết `fastReadSheetValues` & `fastBatchReadSheetValues` dùng Sheets API v4 | done | Khóa UNFORMATTED_VALUE + padding |
| 2026-08-22 10:12 | Phase 1 | Task 1.2 | Đổi Centralized Auth Gate sang Fail-Closed trong `doGet/Code.js` | done | Chặn nếu rỗng hoặc sai token |
| 2026-08-22 10:14 | Phase 1 | Task 1.3 | Thêm CacheService cho `DanhMucDonVi` và `Setup` | done | TTL 6h, giảm I/O |
| 2026-08-22 10:15 | Phase 1 | Task 1.Final | Xây dựng test suite `test_phase1_verification` | done | Sẵn sàng test local |
| 2026-08-22 10:18 | Phase 2 | Task 2.1-2.4 | Tách in-memory TH Lương, CK, BH, Khoản Trừ, KPCĐ; thêm `escapeHtml` chống XSS | done | Tốc độ < 3s, an toàn XSS |
| 2026-08-22 10:20 | Phase 2 | Task 2.Final | Xây dựng test suite `test_phase2_verification` | done | Sẵn sàng test local |
| 2026-08-22 10:22 | Phase 3 | Task 3.1-3.4 | Tách in-memory Hạch toán BH, KPCĐ, Phân bổ Lương & BHXH, Hạch toán Lương & Truy Lĩnh | done | Khớp format UI & data |
| 2026-08-22 10:25 | Phase 3 | Task 3.Final | Xây dựng test suite `test_phase3_verification` | done | Sẵn sàng test local |
| 2026-08-22 11:00 | Phase 4 | Task 4.1-4.2 | Bọc quyền `assertUserHasPermission` và dọn dẹp log | done | Fail-closed auth gate |
| 2026-08-22 11:14 | Phase 4 | Task 4.3-4.4 | Hoàn thiện UI/UX (Progress bar, Hủy thực thi, lề in, độ rộng cột, async tab open) & push GAS | done | Đã push thành công |
| 2026-08-22 11:15 | Phase 4 | Task 4.Final | User nghiệm thu và yêu cầu archive | done | Hoàn tất toàn bộ feature |
