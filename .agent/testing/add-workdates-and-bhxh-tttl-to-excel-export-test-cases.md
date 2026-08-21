# Test Cases: Bổ sung Ngày công tác & BHXH TTTL vào Tổng Hợp Lương Excel

## 1. Happy Path Tests (Kịch bản chuẩn)

### TC-01: Tách đầy đủ 3 ngày công tác từ chuỗi chuẩn
- **Mục tiêu**: Kiểm tra hàm `parseWorkDates` tách chính xác chuỗi `NgayBienChe|NgayVaoNganh|NgayKTHD`.
- **Dữ liệu mẫu**: `2016-11-25|2011-09-01|2019-11-25`
- **Kết quả mong đợi**:
  - `Ngày vào biên chế`: `"2016-11-25"`
  - `Ngày vào ngành`: `"2011-09-01"`
  - `Ngày kết thúc hợp đồng`: `"2019-11-25"`

### TC-02: Đọc 4 khoản BHXH-TTTL từ DataTruyThuLinh L1
- **Mục tiêu**: Kiểm tra hàm `processTTL` trích xuất và cộng dồn 4 cột BHXH-TTTL vào `baseMap`.
- **Dữ liệu mẫu**: Dòng truy thu L1 chứa `BHXH = 150.000`, `BHYT = 30.000`, `BHTN = 10.000`, `KPCĐ = 20.000`.
- **Kết quả mong đợi**:
  - `BHXH-TTTL` = 150,000
  - `BHYT-TTTL` = 30,000
  - `BHTN-TTTL` = 10,000
  - `KPCĐ-TTTL` = 20,000

### TC-03: Kiểm tra cấu trúc 56 cột của mảng headers & rows
- **Mục tiêu**: Đảm bảo bảng tổng hợp xuất ra đúng 56 cột và khớp 100% giữa header và data row.
- **Kết quả mong đợi**: `headers.length === 56` và mọi `row.length === 56`.

---

## 2. Edge Case & Negative Tests (Kịch bản biên và lỗi)

### TC-04: Xử lý chuỗi ngày công tác bị khuyết từng phần
- **Mục tiêu**: Đảm bảo các chuỗi ngày dạng `2026-03-24||2029-03-24`, `|1995-03-01|`, `2023-04-01||`, `||` không gây crash và gán rỗng đúng ô khuyết.
- **Kết quả mong đợi**:
  - `2026-03-24||2029-03-24` -> `["2026-03-24", "", "2029-03-24"]`
  - `|1995-03-01|` -> `["", "1995-03-01", ""]`
  - `||` hoặc `null` -> `["", "", ""]`

### TC-05: Xử lý ô Ngày công tác dạng Date Object
- **Mục tiêu**: Kiểm tra nếu Google Sheets tự chuyển ô thành Date Object thì `parseWorkDates` tự động format về chuỗi `yyyy-mm-dd`.
- **Dữ liệu mẫu**: `new Date(2026, 2, 24)`
- **Kết quả mong đợi**: Return `["2026-03-24", "", ""]` không ném TypeError exception.

### TC-06: Sheet nguồn thiếu cột hoặc khác tiêu đề alias
- **Mục tiêu**: Kiểm tra hàm `requireColumns` khớp đúng cột cho dù tiêu đề ghi `Ngày công tác`, `Ngày CT`, `BHXH`, `Bảo hiểm xã hội`, `KPCĐ`, `Đoàn phí CĐ`.
- **Kết quả mong đợi**: Trích xuất dữ liệu thành công không báo lỗi fail-fast validation.
