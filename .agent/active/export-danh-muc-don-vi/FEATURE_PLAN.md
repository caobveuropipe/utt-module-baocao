# Feature Plan: Xuất danh mục phòng ban bộ phận

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Đã review, sửa plan theo findings, có thể handoff sang coordinator
> **Feature slug**: export-danh-muc-don-vi
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-06-01

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Cần một tính năng để xuất danh sách các phòng ban/đơn vị từ file dữ liệu gốc để sử dụng cho mục đích in ấn hoặc báo cáo.
- **Vấn đề cần giải quyết:** Hiện tại chưa có chức năng xuất danh sách đơn vị.
- **Mục tiêu:** Thêm tính năng xuất (Print HTML và Excel) danh sách đơn vị lấy từ sheet Setup của file Master.
- **Kết quả mong đợi:** Người dùng có thể nhấn nút xuất danh sách đơn vị từ giao diện, chọn in HTML hoặc tải Excel với đúng định dạng (Mã đơn vị bỏ tiền tố DV, Tên đơn vị gộp mã và tên).
- **Lưu ý quan trọng:** Feature này KHÔNG phụ thuộc tháng lương. Dữ liệu danh mục đơn vị là master data tĩnh, không cần chọn tháng trước khi xuất.

## 2. Phạm vi

### In scope
- Đọc dữ liệu từ cột K và L sheet `Setup` của file `MASTER_DATA`.
- Xử lý chuỗi: bỏ tiền tố "DV" ở Mã đơn vị, ghép chuỗi Tên đơn vị.
- Tạo API route mới trong `doGet/Code.js` (ví dụ: `exportDanhMucDonVi` và `getPrintDanhMucDonVi`). Route KHÔNG nhận tham số `month`.
- Xây dựng UI button trên `client/pg_general_2.html` (nhóm "Khác" hoặc nhóm mới). Dialog SweetAlert KHÔNG yêu cầu chọn tháng.
- Viết logic tạo HTML in bản in.
- Viết logic tạo file Excel xuất danh sách.

### Out of scope
- Sửa đổi cấu trúc của sheet `Setup`.
- Phân quyền phức tạp (dùng chung quyền `Tính lương-Xem` hiện tại).

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** Giữ nguyên kiến trúc 3-module. Các API route thêm vào `Code.js`, logic xử lý tạo file/báo cáo tách ra file riêng hoặc viết trực tiếp nếu ngắn.
- **"Cấm kỵ" cần tránh:** Không thực hiện sửa data gốc. Chỉ đọc (Read-only).
- **Ràng buộc kiến trúc liên quan:** Mọi xuất Excel cần thông qua cơ chế `URL download` hoặc `SpreadsheetApp` lưu ra file tạm/file template.

## 4. Giả định và câu hỏi mở

### Giả định
- Dữ liệu `Mã đơn vị` (cột K) và `Tên đơn vị` (cột L) bắt đầu từ dòng 2 (có header ở dòng 1).
- File template xuất Excel: sẽ sử dụng một ID Google Sheet có sẵn hoặc tạo mới để ghi đè danh sách đơn vị, tương tự như các chức năng xuất báo cáo khác (cần 1 ID cấu hình trong `GLOBAL_CONFIG.FILES`). Giả định tạm dùng biến `EXPORT_DANH_MUC_DON_VI`.
- Giao diện in HTML sẽ tương tự bảng mẫu trong ảnh: Tiêu đề "DANH MỤC ĐƠN VỊ", các cột "Mã đơn vị", "TÊN ĐƠN VỊ", "Ghi chú".

### Câu hỏi mở
- [Non-blocking] Vị trí đặt nút "Xuất danh mục đơn vị" trên giao diện `pg_general_4.html` ở khu vực nào? (Sẽ tạm đặt cùng nhóm với các nút báo cáo chung).
- [Non-blocking] ID của file Excel dùng làm template xuất ra là gì? (Sẽ khai báo 1 ID rỗng hoặc tạo 1 placeholder ID, User cần cung cấp sau).

## 5. Acceptance Criteria

- [ ] Lấy đúng dữ liệu từ sheet `Setup` cột K và L của file `MASTER_DATA`.
- [ ] Mã đơn vị được loại bỏ tiền tố "DV".
- [ ] Tên đơn vị có định dạng `[Mã đơn vị không có DV] - [Tên gốc]`.
- [ ] Tính năng In (HTML) hiển thị đúng bảng mẫu.
- [ ] Tính năng Xuất Excel ghi đúng dữ liệu ra file và tải về thành công.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `doGet/Code.js` | Sửa | Thêm route `exportDanhMucDonVi` và `getPrintDanhMucDonVi` (không nhận `month`) | 🟢 | Không rõ |
| `doGet/doGet_danhMucDonVi.js` | Tạo mới | Chứa logic lấy data, format và tạo file Excel. Cột Mã đơn vị phải set `.setNumberFormat('@')` | 🟢 | N/A |
| `client/pg_general_1.js` | Sửa | Thêm hàm lấy data in HTML từ server `pg1_ed1_getPrintDanhMucDonVi` | 🟢 | Không rõ |
| `client/pg_general_2.html` | Sửa | Thêm nút "Danh mục đơn vị" vào nhóm "Khác" | 🟢 | Không rõ |
| `client/pg_general_3.html` | Sửa | Thêm hàm `printDanhMucDonVi()` và `generateDanhMucDonViHtml()` (theo pattern hiện tại) | 🟢 | Không rõ |
| `client/pg_general_4.html` | Sửa | Thêm hàm `pg_general_4_exportDanhMucDonVi()` với SweetAlert (không yêu cầu chọn tháng) | 🟢 | Không rõ |

## 7. Risk Triage và Review Focus

- **Review required:** No (Logic độc lập, an toàn).
- **Risk hotspots:** Không có.
- **Review focus areas:** Cách parsing string "DV".
- **Known pitfalls / historical issues:** Chú ý việc cache data nếu có, nhưng ở đây có thể đọc trực tiếp.
- **Dependencies / rollout concerns:** Cần chuẩn bị 1 file Google Sheet làm nơi xuất Excel.

## 8. Chiến lược triển khai

- **Phase strategy:** 
  - Phase 1: Tạo Core API & Logic xử lý dữ liệu ở Backend (`doGet_danhMucDonVi.js`, `Code.js`).
  - Phase 2: Xây dựng giao diện In HTML.
  - Phase 3: Xây dựng tính năng xuất Excel.
  - Phase 4: Tích hợp vào UI và tích hợp chức năng (`pg_general_4.html`, `pg_general_1.js`).
- **Thứ tự triển khai:** Backend -> In HTML -> Xuất Excel -> Tích hợp UI.

## 9. Test Strategy

- **Manual verification:** 
  - Click xuất In -> Kiểm tra giao diện bản in.
  - Click Xuất Excel -> Mở file tải về kiểm tra cột, dữ liệu, định dạng (đặc biệt cột Mã đơn vị không bị mất số 0 ở đầu).

## 10. Rollback Plan

- Xóa các file mới tạo, revert `Code.js`, `pg_general_1.js` và `pg_general_4.html` về trạng thái trước khi sửa.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`

## Review Notes

> Review ngày: 2026-06-01
> Verdict: ✅ ĐỒNG Ý (sau khi sửa)
> Reviewer: Kiến Trúc Sư Trưởng + Delivery và QA

- **FR-01 [Trung bình] — Đã sửa**: Thay `pg_general_4_print.html` bằng `pg_general_3.html` (đúng convention hiện tại).
- **FR-02 [Trung bình] — Đã sửa**: Ghi rõ feature không phụ thuộc tháng, cập nhật route/UI.
- **FR-03 [Thấp] — Đã sửa**: Bổ sung `.setNumberFormat('@')` vào task xuất Excel.
- **FR-04 [Thấp] — Ghi nhận**: Giữ 4 phases, không gộp.
