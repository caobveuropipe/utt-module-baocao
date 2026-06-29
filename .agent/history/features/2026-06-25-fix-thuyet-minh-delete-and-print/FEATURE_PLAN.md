# Feature Plan: Sửa Lỗi Tự Tính Lại Khi Xóa Và Tối Ưu Tốc Độ In Thuyết Minh L1/L2

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Khuyến nghị gọi `feature-review` trước khi thực thi
> **Feature slug**: fix-thuyet-minh-delete-and-print
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-06-25

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Dự án thuyết minh lương L1 và L2 vận hành trên Google Apps Script hiện có hai vấn đề chính: sau khi xóa dữ liệu của một tháng thì hệ thống tự động tính toán lại tháng đó; và khi người dùng thực hiện In báo cáo (đi ngân hàng hoặc thuyết minh), hệ thống mất rất nhiều thời gian xử lý và thỉnh thoảng quay spinner vô tận không trả kết quả.
- **Vấn đề cần giải quyết:**
  1. *Lỗi tự động tính lại:* Nút xóa dữ liệu gọi hàm load lại trạng thái `functionInit(false)`. Hàm này đọc tham số tháng trên URL và tự động chạy tính lương nếu có tham số này.
  2. *Lỗi logic in ở L1:* Hàm `printAnCa` trả về dữ liệu in (mảng 2D) nhưng logic doPost lại so khớp với chuỗi `'Success'`, dẫn đến luôn báo lỗi từ máy chủ.
  3. *Hiệu năng in chậm:* Các hàm in mở và đọc toàn bộ dữ liệu của nhiều bảng tính lớn (như `DataLuong1`, `DataChotNSThang`) bằng cách sử dụng `SpreadsheetApp.openById(...)` và `.getDataRange().getValues()`.
- **Mục tiêu:** 
  - Khắc phục lỗi tự động tính toán lại sau khi xóa dữ liệu.
  - Sửa lỗi logic phản hồi in ở L1.
  - Tăng tốc độ in báo cáo lên gấp nhiều lần bằng cách tối ưu hóa các lệnh truy xuất Google Sheets.
- **Kết quả mong đợi:** 
  - Xóa dữ liệu thành công, trạng thái chuyển về "Chưa tạo thuyết minh" mà không tự động tính toán lại.
  - Bấm nút in phản hồi ngay lập tức (dưới 10 giây) và mở tab in chính xác.

## 2. Phạm vi

### In scope
- Chỉnh sửa `pg_general_3.html` và `modal_dataluong_3.html` của cả L1 và L2 để chỉ tự động tính toán trong lần tải trang đầu tiên (`isFirstLoad === true`).
- Sửa logic xử lý kết quả in của `doPost(e)` trong `ThuyetMinhL1/doPost/Code.js`.
- Thay thế các lệnh đọc bảng tính truyền thống bằng Sheets API nâng cao (`Sheets.Spreadsheets.Values.get`) trong `doGet_function.js` của L1 và L2 tại các bảng dữ liệu lớn.
- <!-- Sửa theo EFR-01: Tối ưu hóa việc đọc bảng DataLuong1 bằng Sheets API (range hẹp) trong in L1 -->
- <!-- Sửa theo EFR-02: Khử trùng lặp gọi doGet_getDataNhanSu_SoTaiKhoan nhiều lần trong một request ở L2 (truyền map qua cache/parameter) -->
- <!-- Sửa theo EFR-03: Khóa tham số valueRenderOption: 'UNFORMATTED_VALUE' khi gọi Sheets API cho các cột tiền, hệ số và 'FORMATTED_VALUE' cho các cột text để bảo toàn kiểu dữ liệu -->

### Out of scope
- Sửa đổi các bảng tính nguồn hoặc thay đổi cấu trúc DB hiện tại.
- Các tính năng khác ngoài thuyết minh lương L1/L2.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** Tách biệt logic doGet/doPost và sử dụng `LibraryDigiCore` làm thư viện dùng chung.
- **"Cấm kỵ" cần tránh:** Không thay đổi cách tổ chức tệp hoặc thay đổi các cấu hình API Web App hiện tại mà không cập nhật client tương ứng.

## 4. Giả định và câu hỏi mở

### Giả định
- Dự án đã kích hoạt Sheets Advanced Service (Sheets API v4) cho cả các dự án `doGet` L1 và L2 (Đã xác minh qua `appsscript.json`).

### Câu hỏi mở
- *Không có câu hỏi chặn.*

## 5. Acceptance Criteria

- [ ] Khi nhấn nút Xóa dữ liệu cho một tháng nhất định, trạng thái của tháng đó cập nhật thành "Chưa tạo thuyết minh", spinner tắt, hiển thị Toast thông báo xóa thành công và bảng dữ liệu được xóa trống (không tự động tính lại).
- [ ] Khi chọn in bảng đi ngân hàng hoặc bảng thuyết minh ở cả L1 và L2, hệ thống load dữ liệu in nhanh chóng (dưới 10 giây) và mở cửa sổ in chuẩn của trình duyệt.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| [ThuyetMinhL1/client/pg_general_3.html](file:///d:/Project/UoTT/Dikhobac/ThuyetMinhL1/client/pg_general_3.html) | Sửa | Thêm tham số `isFirstLoad` vào `functionInit` để ngăn tính lại sau khi xóa. | 🟢 Thấp | Không |
| [ThuyetMinhL2/client/pg_general_3.html](file:///d:/Project/UoTT/Dikhobac/ThuyetMinhL2/client/pg_general_3.html) | Sửa | Thêm tham số `isFirstLoad` vào `functionInit` tương tự L1. | 🟢 Thấp | Không |
| [ThuyetMinhL1/client/modal_dataluong_3.html](file:///d:/Project/UoTT/Dikhobac/ThuyetMinhL1/client/modal_dataluong_3.html) | Sửa | Cập nhật hàm gọi `functionInit(false, false)`. | 🟢 Thấp | Không |
| [ThuyetMinhL2/client/modal_dataluong_3.html](file:///d:/Project/UoTT/Dikhobac/ThuyetMinhL2/client/modal_dataluong_3.html) | Sửa | Cập nhật hàm gọi `functionInit(false, false)`. | 🟢 Thấp | Không |
| [ThuyetMinhL1/doPost/Code.js](file:///d:/Project/UoTT/Dikhobac/ThuyetMinhL1/doPost/Code.js) | Sửa | Sửa logic phản hồi của action `print` để chấp nhận mảng dữ liệu thay vì chuỗi `"Success"`. | 🟢 Thấp | Không |
| [ThuyetMinhL1/doGet/doGet_function.js](file:///d:/Project/UoTT/Dikhobac/ThuyetMinhL1/doGet/doGet_function.js) | Sửa | Tối ưu hóa hiệu năng đọc bằng cách dùng Sheets API trực tiếp cho các file Spreadsheet lớn. | 🟡 Trung bình | Không |
| [ThuyetMinhL2/doGet/doGet_function.js](file:///d:/Project/UoTT/Dikhobac/ThuyetMinhL2/doGet/doGet_function.js) | Sửa | Tối ưu hóa hiệu năng đọc bằng Sheets API tương tự L1. | 🟡 Trung bình | Không |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Hàm đọc dữ liệu bằng Sheets API cần trả về định dạng mảng 2D chuẩn xác như phương thức cũ (`.getValues()`) để không ảnh hưởng đến các bước xử lý logic phía sau. <!-- Sửa theo EFR-03: Rủi ro parse số học khi giá trị bị đổi định dạng chuỗi địa phương -->
- **Review focus areas:** Kiểm tra việc định dạng kiểu dữ liệu (chuỗi, số, ngày tháng) trả về từ Sheets API có trùng khớp hoàn toàn với phương thức của `SpreadsheetApp` hay không. Thiết lập tham số valueRenderOption tương ứng (UNFORMATTED_VALUE/FORMATTED_VALUE).

## 8. Chiến lược triển khai

- **Phase strategy:** Chia làm 2 Phase:
  - **Phase 1:** Sửa bug tự động tính toán lại sau khi xóa trên client-side L1/L2 và sửa logic in của doPost ở L1.
  - **Phase 2:** Tối ưu hiệu năng truy vấn dữ liệu in trên server-side L1/L2 bằng Sheets API.
- **Thứ tự triển khai:** Thực hiện sửa đổi trên L1 trước, kiểm tra tính đúng đắn rồi áp dụng sang L2.

## 9. Test Strategy

- **Automated tests:** Không có (sử dụng chạy thử trực tiếp trên GAS).
- **Manual verification:**
  - Thực hiện các bước xóa dữ liệu tháng thử nghiệm và quan sát trạng thái.
  - Bấm in các phân hệ và đo lường thời gian phản hồi.

## 10. Rollback Plan

- Sử dụng các file backup hoặc khôi phục trạng thái code bằng clasp/git nếu phát hiện lỗi nghiêm trọng.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
