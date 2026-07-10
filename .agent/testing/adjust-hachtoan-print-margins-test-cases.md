# Test Cases - Tối ưu lề in và cỡ chữ Chức năng hạch toán

> Tạo ngày: 2026-07-10
> Liên kết feature: `adjust-hachtoan-print-margins`
> Phạm vi: Feature / Styling

---

## 1. Mục tiêu kiểm thử

- Đảm bảo 4 báo cáo hạch toán xuất PDF có khoảng lề chính xác (lề trái 0.5 inch, các lề khác 0.25/0.5 inch).
- Đảm bảo font chữ đã chuyển sang Arial, kích thước chữ phân cấp rõ ràng (Tiêu đề: 12, Header: 11, Data: 10/10.5) và không bị ghi đè.
- Đảm bảo tiêu đề & header bảng hạch toán bảo hiểm được lặp lại chính xác từ trang 2 khi phân trang PDF.
- Đảm bảo cột Nội dung của báo cáo Lương & Truy lĩnh co lại gọn gàng và không bị vỡ bố cục.

## 2. Tiền điều kiện

- Đã deploy thành công code mới lên Google Apps Script.
- Người dùng có quyền truy cập vào chức năng hạch toán trên Web UI.

## 3. Happy Path

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| HP-01 | Chọn tháng, nhấn xuất PDF **Bảng hạch toán bảo hiểm** | PDF xuất ra dùng font Arial, lề trái rộng hơn lề phải, tiêu đề chính size 12, header size 11, body size 10. |
| HP-02 | Kiểm tra trang 2 của PDF **Bảng hạch toán bảo hiểm** | 6 dòng đầu (bao gồm tiêu đề và 2 dòng header) được lặp lại nguyên vẹn ở đầu trang 2. |
| HP-03 | Nhấn xuất PDF **Bảng hạch toán KPCĐ** | PDF xuất ra dùng font Arial, tiêu đề chính size 12, header size 11, body size 10. |
| HP-04 | Nhấn xuất PDF **Bảng kê hạch toán lương & truy lĩnh** | PDF dùng font Arial, cột Nội dung thu hẹp rõ rệt, tiêu đề size 12, header size 11, body size 10.5, không bị dư dòng viền trống số 3. |
| HP-05 | Nhấn xuất PDF **Bảng phân bổ tiền lương và BHXH** | PDF dùng font Arial, tiêu đề size 12, header dòng 8 size 11, header dòng 9 size 10, body size 10.5. |

## 4. Edge / Regression

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| RG-01 | Kiểm tra các dòng tổng cộng / bold hàng | Các dòng in đậm vẫn giữ nguyên border và font Arial, không bị lệch hàng do đổi size chữ. |
| RG-02 | Kiểm tra khu vực chữ ký ở chân trang | Phần chữ ký copy từ Master vẫn đầy đủ, không bị vỡ định dạng hay mất nét viền. |

## 5. Negative Cases

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| NG-01 | Xuất file Excel (XLSX) thay vì PDF | File Excel tải xuống bình thường, mở ra có đúng font Arial và cỡ chữ tương ứng, không bị lỗi cấu trúc dữ liệu. |

## 6. Ghi chú regression

- Khi kiểm tra file PDF, nếu có dữ liệu bị quấn dòng (wrap text) quá nhiều gây mất thẩm mỹ ở cột hẹp, cần điều chỉnh lại độ rộng cột thủ công trong sheet template hoặc code.
