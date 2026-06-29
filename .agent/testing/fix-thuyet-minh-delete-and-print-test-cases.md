# Test Cases - Sửa Lỗi Xóa Và Tối Ưu Hiệu Năng In Thuyết Minh L1/L2

> Tạo ngày: 2026-06-25
> Liên kết feature: `fix-thuyet-minh-delete-and-print`
> Phạm vi: Bug fix / Performance Optimization

---

## 1. Mục tiêu kiểm thử

- Đảm bảo rằng việc xóa dữ liệu thuyết minh không tự động chạy tính toán lại kỳ đó khi URL có tham số tháng.
- Xác nhận tốc độ biên dịch dữ liệu in (đi ngân hàng và thuyết minh) L1/L2 phản hồi nhanh chóng (dưới 10 giây).
- Đảm bảo tính nhất quán của định dạng số tài khoản ngân hàng và các cột số/tiền khi truy vấn qua Sheets API.

## 2. Tiền điều kiện

- Đã deploy code mới lên cả hai phân hệ L1 và L2.
- Tài khoản kiểm thử có quyền `Tính lương-Xóa;` và `Tính lương-Xem;`.

## 3. Happy Path

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| HP-01 | Truy cập URL có tham số tháng (VD: `?thang=T12.2025`). Nhấn nút "Xóa dữ liệu". | Dữ liệu được xóa thành công, spinner tắt, trạng thái chuyển về "Chưa tạo thuyết minh" và giao diện hiển thị bảng trống (không tự động chạy lại tính toán). |
| HP-02 | Nhấn nút "In" -> Chọn khu vực -> Chọn "Phần 1 - bảng đi ngân hàng" hoặc "Phần 2 - bảng thuyết minh". | Spinner hiển thị và tắt nhanh chóng (dưới 10 giây). Cửa sổ in trình duyệt mở ra đầy đủ dữ liệu. |

## 4. Edge / Regression

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| RG-01 | Kiểm tra các cột số tài khoản ngân hàng có bắt đầu bằng chữ số 0 trong bảng đi ngân hàng. | Số tài khoản không bị mất chữ số 0 ở đầu (được bảo toàn định dạng text do dùng `FORMATTED_VALUE`). |
| RG-02 | Kiểm tra các cột tiền, phụ cấp, tổng lĩnh. | Hiển thị chính xác các giá trị số và tổng chung không bị lỗi NaN (được bảo toàn định dạng raw number do dùng `UNFORMATTED_VALUE`). |

## 5. Negative Cases

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| NG-01 | Thực hiện in khi tháng chọn chưa được tạo thuyết minh. | Hiện thông báo cảnh báo yêu cầu tính lương và lưu lại trước khi in. |

## 6. Security / Permission

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| SC-01 | Đăng nhập bằng tài khoản không có quyền xóa và nhấn xóa. | Hệ thống từ chối thực thi và báo lỗi quyền hạn, dữ liệu không bị xóa. |

## 7. Ghi chú regression

- Cần giám sát hiệu năng thực thi của doGet API qua Cloud Logger của GAS để kiểm tra độ trễ.
