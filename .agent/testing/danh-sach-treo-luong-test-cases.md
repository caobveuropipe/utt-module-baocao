# Test Cases: Danh Sách Treo Chưa Chi Trả Tiền Lương (Phú Thọ)

> **Mã tính năng**: `danh-sach-treo-luong`
> **Phạm vi**: In ấn HTML & Xuất Excel (Bảng chuyển khoản và Bảng treo lương)
> **Ngày lập**: 2026-08-20

---

## 1. Happy Path Test Cases

| STT | Tình huống | Các bước thực hiện | Kết quả kỳ vọng |
| :--- | :--- | :--- | :--- |
| **TC-01** | Chọn cơ sở Phú Thọ -> Bấm nút In | 1. Chọn tháng bất kỳ.<br>2. Chọn cơ sở **Phú Thọ**.<br>3. Bấm **In**. | Hiển thị modal SweetAlert2 với 2 tùy chọn: *In bảng chuyển khoản* và *In bảng treo lương*. |
| **TC-02** | Chọn "In bảng chuyển khoản" (Phú Thọ) | 1. Tại modal trên, bấm **In bảng chuyển khoản**. | 1. Mở cửa sổ in.<br>2. Tiêu đề: `DANH SÁCH CHUYỂN KHOẢN TIỀN LƯƠNG...`.<br>3. Danh sách **không chứa** nhân sự có trạng thái `Đi công tác NN` / `Đi NN`.<br>4. Chức danh: `Kế toán trưởng`.<br>5. Hiển thị đầy đủ `Phần dành cho ngân hàng`. |
| **TC-03** | Chọn "In bảng treo lương" (Phú Thọ) | 1. Tại modal trên, bấm **In bảng treo lương**. | 1. Mở cửa sổ in.<br>2. Tiêu đề: **`DANH SÁCH TREO CHƯA CHI TRẢ TIỀN LƯƠNG`**.<br>3. Danh sách **chỉ chứa** nhân sự thuộc Phú Thọ có trạng thái `Đi công tác NN` / `Đi NN`.<br>4. Chức danh: **`Phụ trách kế toán`**.<br>5. **Ẩn hoàn toàn** `Phần dành cho ngân hàng`. |
| **TC-04** | Chọn cơ sở Phú Thọ -> Bấm Xuất Excel | 1. Chọn tháng bất kỳ.<br>2. Chọn cơ sở **Phú Thọ**.<br>3. Bấm **Xuất Excel**. | Hiển thị modal SweetAlert2 với 2 tùy chọn: *Xuất Excel chuyển khoản* và *Xuất Excel treo lương*. |
| **TC-05** | Chọn "Xuất Excel treo lương" (Phú Thọ) | 1. Tại modal trên, bấm **Xuất Excel treo lương**. | 1. File Excel tải về có tiêu đề ô A3: `DANH SÁCH TREO CHƯA CHI TRẢ TIỀN LƯƠNG`.<br>2. Dữ liệu chỉ gồm nhân sự đi công tác NN.<br>3. Chữ ký đổi thành `Phụ trách kế toán`.<br>4. Phần ngân hàng bị xóa bỏ.<br>5. Không có trang trắng dư thừa. |

---

## 2. Regression & Edge Case Test Cases

| STT | Tình huống | Các bước thực hiện | Kết quả kỳ vọng |
| :--- | :--- | :--- | :--- |
| **TC-06** | Chọn cơ sở Hà Nội / Tất cả cơ sở -> Bấm In | 1. Chọn cơ sở **Hà Nội** hoặc **All**.<br>2. Bấm **In**. | In trực tiếp Bảng chuyển khoản như cũ, **không hiện** modal hỏi chọn. |
| **TC-07** | Chọn cơ sở Hà Nội / Tất cả cơ sở -> Bấm Xuất Excel | 1. Chọn cơ sở **Hà Nội** hoặc **All**.<br>2. Bấm **Xuất Excel**. | Xuất file Excel trực tiếp như cũ, **không hiện** modal hỏi chọn. |
| **TC-08** | Không có nhân sự treo lương tại kỳ chọn | 1. Chọn kỳ tháng không có ai đi công tác NN ở Phú Thọ.<br>2. Bấm in/xuất bảng treo lương. | Thông báo lỗi/cảnh báo hợp lệ "Không có dữ liệu cho kỳ này", không làm crash hệ thống. |
