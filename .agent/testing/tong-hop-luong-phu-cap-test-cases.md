# Test Cases: Đối Chiếu Bảng Tổng Hợp Lương Và Bảng Thanh Toán Thụ Hưởng (ThuyetMinhL1)

## Môi trường & Thiết lập
- **File chạy**: `doGet_tongHopLuong.js`, `ThuyetMinhL1/doGet/doGet_function.js`
- **Hàm xử lý**: `doGet_tongHopLuong(monthStr, resources, targetLocation)`, `doGet_getDataPrint_DiNganHang(monthStr, regionFilter)`
- **Tháng test mặc định**: `T06.2026`
- **Khu vực test**: `Phú Thọ`, `Hà Nội`
- **Tài liệu đối chiếu**: Sheet `THLuong` (Bảng tổng hợp lương) vs Giao diện in `Mẫu số 09` (Bảng thanh toán thụ hưởng ThuyetMinhL1)

---

## Danh Sách Kịch Bản Test

### TC-01: Đối chiếu khớp số liệu Diện biên chế (Phú Thọ)
- **Mô tả**: Kiểm tra các chỉ tiêu chi tiết của Diện biên chế giữa Bảng tổng hợp lương và Bảng thanh toán đi Kho bạc.
- **Kỳ vọng**:
  - Chỉ tiêu **1.1 Lương + Truy lĩnh, truy thu** trên Bảng TH Lương = Cột **(6) Lương và PC theo lương** trên Bảng thanh toán (`886.791.166 VNĐ`).
  - Chỉ tiêu **1.2 Phụ cấp giáo viên** trên Bảng TH Lương = Cột **(8) Ngành** trên Bảng thanh toán (`196.749.774 VNĐ`).
  - Chỉ tiêu **1.4 Phụ cấp trách nhiệm** trên Bảng TH Lương = Cột **(10) T.Nhiệm** trên Bảng thanh toán (`2.340.000 VNĐ`).
  - Chỉ tiêu **1.5 Phụ cấp tự vệ** trên Bảng TH Lương = Cột **(12) T.vệ** trên Bảng thanh toán (`2.386.800 VNĐ`).
  - Tổng mục **1. Diện biên chế** trên Bảng TH Lương = Cột **(5) Tổng số** của TỔNG Biên chế trên Bảng thanh toán (`1.088.267.740 VNĐ`).

### TC-02: Kiểm tra nhân sự không có dữ liệu lương tháng hiện tại (Fallback)
- **Mô tả**: Nhân sự có trong `DataChotNSThang` hoặc có trong kỳ trước `prevMonthStr`, nhưng không có dòng tính lương trong `DataLuong1` kỳ `monthStr`.
- **Kỳ vọng**:
  - Không bị cộng dồn hệ số phụ cấp (`HS ngành`, `HS độc hại`, `HS trách nhiệm`, `HS tự vệ`) của tháng trước vào tổng phụ cấp tháng hiện tại.
  - Tổng các khoản phụ cấp tháng hiện tại chỉ tính từ những người thực nhận lương trong kỳ.

### TC-03: Kiểm tra tính Lương cơ sở động theo mốc thời gian
- **Mô tả**: Thay đổi kỳ lương giữa các giai đoạn áp dụng mức lương cơ sở khác nhau (ví dụ: trước và sau T07.2026).
- **Kỳ vọng**:
  - Với kỳ lương từ `T07.2026` trở đi: Lương cơ sở tính theo mức `2.530.000 VNĐ`.
  - Với kỳ lương trước `T07.2026`: Lương cơ sở tính theo mức `2.340.000 VNĐ` (hoặc mức cấu hình tương ứng trong sheet `SetupLuong`).
  - Tiền phụ cấp (`HS * LCB`) được tính chính xác theo đúng mức lương cơ sở của kỳ lương đó.
