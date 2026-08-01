# Tóm tắt đối chiếu bảo hiểm T06.2026 – Hà Nội

## Mục tiêu

Đối chiếu BHXH/BHYT/BHTN giữa:

- Bảng phân bổ tiền lương và bảo hiểm xã hội.
- Bảng tổng hợp hạch toán bảo hiểm.

## Các nguyên nhân đã xác định

1. **HĐ 68 và HĐ vụ việc trực tiếp bị thiếu trong Mục II của hạch toán.**
   - Mục II trước đó chỉ cộng biên chế và HĐ dài hạn.
   - Đã bổ sung HĐ 68 và HĐ vụ việc vào tổng trực tiếp.

2. **Dòng “Mã nước ngoài” gộp nhiều loại hợp đồng.**
   - Khi đối chiếu một loại hợp đồng phải chỉ lấy phần “Mã nước ngoài” thuộc đúng loại hợp đồng đó.
   - Ví dụ: Trực tiếp biên chế = `361.759.911 + 3.885.898 = 365.645.809`.

3. **Quy tắc dấu truy lĩnh/truy thu từng bị xử lý không đồng nhất.**
   - Quy tắc nghiệp vụ chốt: **truy lĩnh làm tăng**, **truy thu làm giảm**.
   - Dữ liệu nguồn T06.2026 có truy lĩnh HĐ dài hạn trực tiếp của CB1046:
     - BHXH: `438.048`
     - BHYT: `82.134`
     - BHTN: `54.756`
   - Hạch toán đã được sửa để dùng công thức:
     `Cộng = Lương + Truy lĩnh - Truy thu`.

## Kết quả số liệu sau khi sửa dấu

| Chỉ tiêu | BHXH |
|---|---:|
| Phân bổ lương gốc trước điều chỉnh | 483.755.146 |
| Truy lĩnh BHXH | +438.048 |
| Phân bổ/hạch toán dự kiến sau điều chỉnh | 484.193.194 |

## Cập nhật mã nguồn

- `doGet/doGet_hachToanBaoHiem.js`
  - Bổ sung HĐ 68 và HĐ vụ việc vào Mục II.
  - Chuẩn hóa dấu: truy lĩnh cộng, truy thu trừ.
  - Thêm hàm `test_doiChieuNguonHachToanBaoHiem()` để xuất chi tiết đối chiếu.

- `doGet/doGet_tongHopBaoHiem.js`
  - Giữ nguyên dấu dữ liệu truy lĩnh/truy thu khi tổng hợp, không cộng trị tuyệt đối.

- `doGet/doGet_phanBoLuongBHXH.js`
  - Điều chỉnh truy lĩnh/truy thu trực tiếp vào kết quả nhóm đã phân bổ, không thêm dòng/bộ phận mới.
  - Điều chỉnh dùng đúng phân loại đã xác định từ dòng lương của nhân sự, tránh lệch mã đơn vị giữa nguồn chốt và nguồn lương.
  - Nếu nhân sự chỉ có ở Data truy thu/truy lĩnh mà không có trong DataChotNSThang, tra DataNhanSu theo Mã nhân sự để lấy mã đơn vị và tiếp tục mapping Setup.

- `doGet/doGet_hachToanBaoHiem.js`
  - Nếu nhân sự truy lĩnh/truy thu không có trong DataChotNSThang, dùng DataNhanSu làm fallback để xác định loại hợp đồng, mã đơn vị và khu vực.

## Sheet/hàm kiểm tra

Chạy `test_doiChieuNguonHachToanBaoHiem()` để tạo:

- `DoiChieu_NguonBH`: chi tiết nguồn lương, bộ phận, loại hợp đồng, tình trạng lọc và bảo hiểm.
- `DoiChieu_TruyThuBH`: chi tiết truy lĩnh/truy thu và tác động theo từng nhân sự.

## Bước xác nhận cuối

1. Đồng bộ mã mới lên Apps Script.
2. Chạy lại bảng phân bổ và bảng hạch toán cho `T06.2026`, `Hà Nội`.
3. Kiểm tra BHXH tổng cộng của cả hai bảng phải là `484.193.194`.
