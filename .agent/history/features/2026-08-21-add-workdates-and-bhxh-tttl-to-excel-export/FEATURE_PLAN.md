# Feature Plan: Bổ sung Ngày công tác & BHXH TTTL vào Tổng Hợp Lương Excel

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Đã thông qua hội đồng review kỹ thuật
> **Feature slug**: add-workdates-and-bhxh-tttl-to-excel-export
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-08-21

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Endpoint xuất file Excel tổng hợp lương (`doGet_tongHopExcel.js`) hiện đang tổng hợp dữ liệu từ 6 nguồn (DataChotNSThang, DataLuong1, DataLuong2, DataAnCa, DataTruyThuLinh L1 & L2) thành bảng 49 cột trả về cho người dùng tải về file `.xlsx`.
- **Vấn đề cần giải quyết:** 
  1. Người dùng cần thông tin chi tiết về thâm niên/hợp đồng của nhân sự, hiện được lưu gộp ở cột `AR` (Ngày công tác) trong `DataChotNSThang` dưới dạng chuỗi phân cách `Ngày vào biên chế|Ngày vào ngành|Ngày kết thúc hợp đồng` (ví dụ `2016-11-25|2011-09-01|2019-11-25`, `2026-03-24||2029-03-24`, `|1995-03-01|`, `||`).
  2. Bảng tổng hợp hiện tại chỉ lấy 1 cột tổng số tiền truy thu L1 (`TTTL L1`). Cần bóc tách thêm 4 khoản đóng bảo hiểm/kinh phí công đoàn tương ứng từ nguồn `DataTruyThuLinh` L1 gồm: `BHXH-TTTL`, `BHYT-TTTL`, `BHTN-TTTL`, `KPCĐ-TTTL` (tương ứng các cột AD, AE, AF, AG của nguồn).
- **Mục tiêu:** 
  1. Tách chuỗi cột `Ngày công tác` thành 3 cột riêng: `Ngày vào biên chế`, `Ngày vào ngành`, `Ngày kết thúc hợp đồng` (giữ nguyên định dạng `yyyy-mm-dd`).
  2. Đọc thêm 4 cột `BHXH`, `BHYT`, `BHTN`, `KPCĐ` từ sheet `DataTruyThuLinh` (Lương 1) và đưa vào header với hậu tố `-TTTL` (`BHXH-TTTL`, `BHYT-TTTL`, `BHTN-TTTL`, `KPCĐ-TTTL`).
  3. Mở rộng cấu trúc cột xuất ra từ 49 cột lên 56 cột (thêm 3 cột ngày công tác + 4 cột BH TTTL).
- **Kết quả mong đợi:** File Excel tổng hợp tải về có đầy đủ 56 cột với định dạng chuẩn, dữ liệu ngày và số tiền truy thu BHXH khớp chính xác.

## 2. Phạm vi

### In scope
- Cập nhật logic đọc cột `Ngày công tác` (cột AR / tên cột tương đương) trong sheet `DataChotNSThang` (và fallback từ `DataNhanSu` Master nếu cần).
- Xây dựng hàm parser an toàn để tách chuỗi ngày công tác thành 3 trường `[ngayBienChe, ngayVaoNganh, ngayKTHD]`, bảo đảm chuẩn `yyyy-mm-dd` hoặc để rỗng nếu không có.
- Cập nhật hàm `requireColumns` và đọc thêm 4 cột `BHXH`, `BHYT`, `BHTN`, `KPCĐ` từ nguồn `DataTruyThuLinh` Lương 1.
- Mở rộng mảng `headers` và cấu trúc `rows` trong `buildTongHopSalaryExcelData` để bổ sung 7 cột mới đúng vị trí logic.
- Cập nhật comment docstring từ 49 cột thành 56 cột.

### Out of scope
- Thay đổi cấu trúc dữ liệu trên các Google Sheets nguồn.
- Thay đổi các module tổng hợp khác (như `doGet_tongHopLuong.js`, `doGet_tongHopBaoHiem.js`...).

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - Quy tắc phân hệ 3-module và tính độc lập của module `doGet`.
  - Quy tắc xử lý dữ liệu lớn: Sử dụng các hàm parse an toàn (`parseMoneyVN`, alias matching cho `requireColumns`).
- **"Cấm kỵ" cần tránh:**
  - Không hardcode index cột cố định nếu không có fallback alias linh hoạt (tránh lỗi khi thứ tự cột trong sheet bị xáo trộn).
  - Không làm vỡ định dạng ngày hoặc làm mất các dòng không có ngày công tác.
- **Ràng buộc kiến trúc liên quan:**
  - Giữ nguyên cơ chế sort hiện tại theo `Mã đơn vị` -> `Trọng số Loại HĐ` -> `Mã CB`.

## 4. Giả định và câu hỏi mở

### Giả định
- Định dạng chuỗi ngày công tác trong cột AR luôn tuân thủ cấu trúc phân tách bởi dấu `|` gồm tối đa 3 phần tử: `Phần 1: Ngày vào biên chế | Phần 2: Ngày vào ngành | Phần 3: Ngày kết thúc hợp đồng`. Nếu chuỗi thiếu hoặc rỗng từng phần thì gán rỗng `''`.
- Sheet `DataTruyThuLinh` của Lương 1 có các header tương ứng hoặc alias chứa `BHXH`, `BHYT`, `BHTN`, `KPCĐ` (hoặc `Đoàn phí CĐ`). Giá trị tiền sẽ được cộng dồn theo từng nhân sự `maCB`.
- Vị trí các cột mới:
  - 3 cột ngày công tác được đặt ngay sau thông tin nhân sự (ví dụ sau `Ngân hàng` hoặc trước nhóm `Lương 1`).
  - 4 cột `BHXH-TTTL`, `BHYT-TTTL`, `BHTN-TTTL`, `KPCĐ-TTTL` được đặt cạnh cột `TTTL L1` (hoặc trước `TTTL L2`).

### Câu hỏi mở
- *Non-blocking:* Nếu nhân sự có nhiều dòng truy thu trong cùng 1 kỳ lương thì 4 khoản BHXH-TTTL sẽ được cộng dồn (tương tự như `tttl1`). Đã chọn default là cộng dồn an toàn.

## 5. Acceptance Criteria

- [ ] Sheet `DataChotNSThang` đọc được cột `Ngày công tác` mà không gây lỗi nếu cột bị đổi tên/viết hoa thường.
- [ ] Chuỗi dạng `2016-11-25|2011-09-01|2019-11-25` được tách chính xác thành:
  - Ngày vào biên chế: `2016-11-25`
  - Ngày vào ngành: `2011-09-01`
  - Ngày kết thúc hợp đồng: `2019-11-25`
- [ ] Các chuỗi khuyết như `|1995-03-01|`, `2023-04-01||`, `||` được xử lý an toàn thành các ô rỗng tương ứng.
- [ ] Sheet `DataTruyThuLinh` của L1 trích xuất đúng 4 cột `BHXH`, `BHYT`, `BHTN`, `KPCĐ`, cộng dồn vào đối tượng nhân sự.
- [ ] Danh sách header mới xuất ra đủ 56 cột, bao gồm:
  - `Ngày vào biên chế`, `Ngày vào ngành`, `Ngày kết thúc hợp đồng`
  - `BHXH-TTTL`, `BHYT-TTTL`, `BHTN-TTTL`, `KPCĐ-TTTL`
- [ ] Quá trình xuất Excel Base64 tạo file `.xlsx` thành công, không bị lệch index cột hay sai lệch số liệu.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `doGet/doGet_tongHopExcel.js` | Sửa | Cập nhật hàm `buildTongHopSalaryExcelData` để bổ sung đọc ngày công tác, 4 cột TTTL BHXH, và mở rộng header/rows | 🟡 Thấp-Trung bình (Cần kiểm tra header alias để tránh vỡ validate) | Có |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:**
  - Tên cột trong sheet `DataChotNSThang` và `DataTruyThuLinh` có thể có khoảng trắng hoặc alias khác nhau (ví dụ: `Ngày công tác`, `BHXH`, `Bảo hiểm xã hội`, `KPCĐ`, `Đoàn phí`). Cần cấu hình mảng alias phong phú trong `requireColumns`.
  - Chuỗi ngày phân tách dấu `|` có thể chứa khoảng trắng thừa -> cần `.trim()` từng phần.
- **Review focus areas:**
  - Thứ tự sắp xếp các cột trong `headers` đầu ra có hợp lý và thuận tiện cho nghiệp vụ kế toán/nhân sự không.
  - Xử lý fallback khi một nhân viên không có dữ liệu chốt tháng hiện tại mà lấy từ chốt tháng trước (T-1) hoặc Master NS.
- **Dependencies / rollout concerns:**
  - Không yêu cầu thay đổi cấu trúc bảng Google Sheets, tương thích ngược với luồng gọi `doGet` hiện tại.

## 8. Chiến lược triển khai

- **Phase strategy:** Chia làm 2 phase:
  - **Phase 1:** Triển khai hàm helper parse ngày công tác & cập nhật logic trích xuất dữ liệu từ `DataChotNSThang` và `DataTruyThuLinh`.
  - **Phase 2:** Cập nhật cấu trúc `headers`, mapping `rows`, kiểm thử tính toàn vẹn 56 cột và định dạng xuất Excel.
- **Thứ tự triển khai:**
  1. Thêm hàm `parseWorkDates(workDateStr)`.
  2. Bổ sung `requireColumns` cho `DataChotNSThang` (`Ngày công tác`) và `DataTruyThuLinh` (`BHXH`, `BHYT`, `BHTN`, `KPCĐ`).
  3. Cập nhật `baseMap` lưu trữ 3 trường ngày và 4 trường BH TTTL.
  4. Cập nhật mảng `headers` và hàm ánh xạ `rows`.
  5. Test chạy thử hàm `buildTongHopSalaryExcelData` và `exportTongHopExcelBase64`.

## 9. Test Strategy

- **Automated / Script tests:**
  - Chạy hàm test cục bộ `buildTongHopSalaryExcelData("03/2026", "Tất cả")` để verify độ dài hàng (`row.length === headers.length === 56`).
  - Test các mẫu chuỗi ngày công tác: đầy đủ 3 ngày, chỉ có ngày ngành, chỉ có ngày biên chế, rỗng hoàn toàn.
- **Manual verification:**
  - Tải file Excel thực tế và kiểm tra sự khớp nối dữ liệu cột ngày và cột BHXH-TTTL.

## 10. Rollback Plan

- Khôi phục lại phiên bản commit trước đó của file `doGet/doGet_tongHopExcel.js` nếu phát sinh lỗi không tương thích.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
