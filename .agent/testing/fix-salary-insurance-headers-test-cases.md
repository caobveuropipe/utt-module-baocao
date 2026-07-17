# Test Cases: Sửa lỗi hiển thị header Bảng phân bổ tiền lương và BHXH

## 1. Happy Path: Xuất báo cáo hiển thị chuẩn mẫu

### Yêu cầu tiên quyết
- Có dữ liệu tính lương hợp lệ trên sheet `DataLuong1` cho tháng kiểm thử (ví dụ: `06.2026`).
- Đã chạy `.\push-all` để deploy code server-side mới nhất.

### Các bước thực hiện
1. Truy cập vào giao diện web của ứng dụng.
2. Chọn kỳ lương tháng kiểm thử (`06/2026`).
3. Nhấp chọn xuất **Bảng phân bổ tiền lương và bảo hiểm xã hội**.
4. Mở file Excel/PDF tải về và kiểm tra định dạng.

### Kết quả mong đợi (Expected Results)
- **Tiêu đề báo cáo:** Hiển thị "THÁNG 06 NĂM 2026" ở dòng 4 được căn giữa và in đậm.
- **Dòng 7 (Tiêu đề nhóm):** Các dải ô được merge chuẩn xác:
  - `C7:I7` -> "Hệ số"
  - `K7:N7` -> "Các khoản phải nộp theo lương"
  - `O7:P7` -> "Các khoản giảm trừ"
  - `Q7:R7` -> "Trừ khác"
- **Dòng 8 (Tiêu đề cột):** Các cột chi tiết hiển thị đúng tên:
  - Cột 8 (H8): "ĐH" (in chữ màu đỏ)
  - Cột 9 (I8): "TN" (in chữ màu đỏ)
  - Cột 14 (N8): "Đoàn phí CĐ"
  - Cột 18 (R8): "Quỹ XH" (in chữ màu đỏ)
- **Dòng 9 (Số thứ tự):** Chứa các chuỗi số từ "1" đến "21". Ô cột 9 (I9) hiển thị chuẩn chữ `"9"` (chữ màu đỏ, định dạng Text, không bị số thập phân `9.000`).
- **Dòng 10 (Công thức):** Hiển thị công thức diễn giải chính xác cho các cột (ví dụ: `10 = (3+4+5+6+7+8+9) * 2.340.000` ở cột 10, `21 = 10 - 19` ở cột 21).
- **Dòng 11 trở đi:** Bắt đầu hiển thị dữ liệu phòng ban/đơn vị. Dòng "Bộ phận quản lý" ở dòng 11. Dữ liệu số tiền được phân tách dấu hàng nghìn (ví dụ: `#,##0`), dữ liệu hệ số định dạng 3 chữ số thập phân (`0.000`).
- **Borders:** Toàn bộ viền ngoài và các nét phân tách cột là nét liền (SOLID). Nét ngang giữa các dòng dữ liệu là nét đứt (DOTTED). Viền toàn bộ 4 dòng header (7-10) là nét liền SOLID.
- **Không thừa cột:** Bảng tính kết thúc chính xác ở cột U (Cột 21 - Số tiền được lĩnh). Không có cột V trống bị in kèm.
