# Feature Tasks: Thêm dòng Thuế TNCN vào Bảng tổng hợp lương

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-05-19

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Logic phía Server (doGet_tongHopLuong.js)

**Mục tiêu:** Tích hợp việc lấy Thuế TNCN tháng trước từ file TinhThue, hiển thị thành công dòng IV trên Google Sheets và cập nhật dòng Cộng.

- [x] Task 1.1: Định nghĩa helper `getPrevMonthStr` ở cuối file `doGet/doGet_tongHopLuong.js`.
- [x] Task 1.2: Thêm logic đọc dữ liệu từ file `TinhThue` (`1Xcp4cBjKcHWt_FQULd7MrC7fhiX8ZVMzL8wXJ3aoJLw`) bằng hàm `getData` cho kỳ trước của `monthStr` trong `doGet_tongHopLuong.js`.
- [x] Task 1.3: Cập nhật `initMetric`, gán `emp.amounts.thueTNCN = thueTNCNMap[maCB] || 0` và cộng dồn theo địa bàn/cơ sở trong hàm `doGet_tongHopLuong`.
- [x] Task 1.4: Thêm dòng `IV. THU THUẾ TNCN THÁNG mm/yyyy` và sửa công thức tính dòng Cộng thành `I + II + III - IV`.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Đã push lên server, kiểm tra biên tập code không có lỗi cú pháp và chạy deploy thành công).

## Phase 2: Đồng bộ phía Client (pg_general_3.html)

**Mục tiêu:** Cập nhật bản xem trước và chức năng in trên client khớp với dữ liệu từ server.

- [x] Task 2.1: Đồng bộ logic tính toán và hiển thị dòng IV cùng dòng Cộng trong `generateLuongHtml` của `client/pg_general_3.html` (đã xác minh logic render hoàn toàn động, tự động nhận diện định dạng dòng "IV." và "Cộng: ( I + II + III - IV )" để in đậm).
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Đã deploy thành công client lên Apps Script).

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-05-19 17:42 | Phase 1 | Khởi tạo | Tạo kế hoạch và danh sách task | done | |
| 2026-05-19 17:43 | Phase 1 | Task 1.1-1.4 | Thực hiện sửa file `doGet_tongHopLuong.js` | done | |
| 2026-05-19 17:44 | Phase 1 & 2 | Deploy | Chạy push-all và deploy các module lên GAS | done | Deploy thành công version 104 (doGet) và 21 (client) |
