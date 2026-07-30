# Test Cases: Bảng Kê Hạch Toán Lương Và Truy Lĩnh LƯơng

## Môi trường & Thiết lập
- **File chạy**: `doGet_hachToanLuongVaTruyLinh.js`
- **Hàm test**: `test_chiTietThanhPhanHachToanLuong(monthStr, location)`
- **Tháng test mặc định**: `T06.2026`
- **Địa phương mặc định**: `Hà Nội` (hoặc `Phú Thọ`)
- **Sheet kết quả Audit**: `Audit_HachToanLuong` trong file `EXPORT_HT_TH_LUONG_VA_TTTL`

---

## Danh Sách Kịch Bản Test Manual

### TC-01: Kiểm tra lọc phân biệt khu vực Hà Nội vs Phú Thọ
- **Đầu vào**: Chạy hàm test với `location = 'Hà Nội'`.
- **Kỳ vọng**: 
  - Các cán bộ thuộc Phú Thọ (ví dụ `CB917`, `CB918`) **không xuất hiện** trong danh sách hay tính tổng của bảng Hà Nội.
  - Tổng số lượng cán bộ và tổng tiền chỉ bao gồm nhân sự thuộc khu vực Hà Nội.

### TC-02: Kiểm tra tính Truy lĩnh từ chênh lệch Lương CĐ
- **Đầu vào**: Dữ liệu có nhân sự có cột `AE` (Lương CĐ) ở `DataLuong1` > 0 và nhỏ hơn `Lương CĐ` được chốt trong `DataChotNSThang`.
- **Kỳ vọng**: Phần chênh lệch (`Lương CĐ chốt - Lương CĐ DataLuong1`) được đưa vào mục **II. Truy thu, truy lĩnh** dưới dạng Truy lĩnh.

### TC-03: Kiểm tra phân loại TruyThu1 theo cột Còn nhận (AH)
- **Đầu vào**: Sheet `TruyThu1` chứa các dòng có cột `Còn nhận` (AH) > 0 và < 0.
- **Kỳ vọng**:
  - Dòng có `Còn nhận > 0` được tổng hợp vào **Truy lĩnh** tương ứng theo Loại HĐ (BC, HĐ 68, HĐ khác).
  - Dòng có `Còn nhận < 0` được tổng hợp vào **Truy thu** tương ứng.
  - Dòng có `Còn nhận = 0` bị bỏ qua.

### TC-04: Kiểm tra hiển thị tổng hợp đầy đủ A, B, C, D và Tổng cộng
- **Kỳ vọng**:
  - **Mục A**: Tổng lương ngạch bậc và truy lĩnh (Gián tiếp + Trực tiếp).
  - **Mục B**: Thu nhập tăng thêm (từ `DataLuong2` và `DataTruyThuLinh`).
  - **Mục C**: Ăn ca (từ `DataAnCa`).
  - **Mục D**: Thuế TNCN.
  - **Dòng Tổng cộng**: Kết quả khớp công thức `A + B + C - D`.

### TC-05: Kiểm tra tính toán Treo Lương
- **Đầu vào**: Chạy hàm test với `location = 'Phú Thọ'`. Cán bộ thỏa mãn điều kiện thuộc `Phú Thọ` và có trạng thái `Đi NN` hoặc `Đi công tác NN`.
- **Kỳ vọng**:
  - Tiền ở cột `Tổng lương 1` (Còn nhận) trong `DataLuong1` của cán bộ này được tổng hợp chính xác vào cột **Treo lương** tương ứng với phân loại chi phí và loại hợp đồng của họ.
  - Trường `Thực lĩnh` (`ThucLinh`) của cán bộ này bị khấu trừ đi số tiền treo lương này.
