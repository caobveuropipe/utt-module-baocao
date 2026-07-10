# Feature Plan: Thuyết minh lương 1 - Cập nhật tổng lương và truy lĩnh Phần II

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: [Khuyến nghị gọi `feature-review`]
> **Feature slug**: `thuyet-minh-luong-tong-luong-truy-linh`
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-06-25

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Khi in Thuyết minh lương 1 (Phần II: Thuyết minh tăng giảm lương ngạch bậc và các khoản phụ cấp tháng), phần tổng hợp ở chân bảng hiện tại đang hiển thị tổng lương và truy lĩnh tính bằng cách cộng dồn từ các nhân sự được lọc ra trong bảng (chỉ các nhân sự "Có thay đổi").
- **Vấn đề cần giải quyết:** Tổng lương và truy lĩnh của tháng T và tháng T-1 hiển thị ở chân bảng thuyết minh phải là tổng của toàn bộ nhân sự thuộc khu vực được chọn (Hà Nội, Phú Thọ...), tương đương phần **TIỀN LƯƠNG: (1+2+3+4)** trên bảng "Tổng hợp lương" tại màn hình chính, chứ không phải chỉ là tổng của các cán bộ có thay đổi.
- **Mục tiêu:** Cập nhật công thức tính tổng lương và truy lĩnh tháng T và tháng T-1 ở Phần II của Thuyết minh lương 1 hiển thị đúng tổng số liệu thực tế phần **TIỀN LƯƠNG: (1+2+3+4)** của khu vực được chọn.
- **Kết quả mong đợi:** Khi chọn in thuyết minh lương (cả có thay đổi và không thay đổi), phần tổng hợp chân bảng in hiển thị đúng giá trị tổng lương và truy lĩnh của toàn bộ nhân sự phần TIỀN LƯƠNG (lấy từ DatabaseL1 của tháng đó, lọc theo khu vực được chọn).

## 2. Phạm vi

### In scope
- Xây dựng API helper ở backend để lấy tổng thực tế của dòng `TIỀN LƯƠNG: (1+2+3+4)` cho kỳ lương và khu vực được chọn bằng cách gọi API của dự án chính.
- Truyền dữ liệu tổng này qua API response của `coThayDoi_DataPrint` (hoặc các type in ấn khác nếu cần).
- Cập nhật client-side logic để nhận dữ liệu tổng này và truyền vào hàm render in ấn `openPrintWindow_ThuyetMinh`.
- Cập nhật giao diện in ấn sử dụng giá trị tổng chuẩn thay vì cộng dồn từ danh sách dòng lọc.

### Out of scope
- Thay đổi cấu trúc dữ liệu hoặc thay đổi logic tính toán lương gốc trong sheet `DatabaseL1`.
- Các phần thuyết minh khác không liên quan đến tổng lương Phần II.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** Tôn trọng cấu trúc module hóa (tách doGet, client riêng biệt).
- **"Cấm kỵ" cần tránh:** Tránh đọc trực tiếp SpreadsheetApp đồng bộ nhiều lần gây lỗi timeout; sử dụng API fetch để tối ưu tốc độ và sự đồng nhất dữ liệu.

## 4. Giả định và câu hỏi mở

### Giả định
- API chính có thể truy cập được thông qua URL và trả về đúng định dạng của `getPrintDataTongHopLuong`.

### Câu hỏi mở
- *Không có câu hỏi blocking.*

## 5. Acceptance Criteria

- [ ] API backend trả về trường `totalSums` chứa `totalLuongT` và `totalLuongT1` là tổng thực tế phần TIỀN LƯƠNG (1+2+3+4) lấy từ API chính tương ứng với tháng và khu vực được chọn.
- [ ] Hàm in `openPrintWindow_ThuyetMinh` hiển thị đúng giá trị từ `totalSums` ở phần chân trang thuyết minh.
- [ ] Phần chênh lệch (Tăng/Giảm so với tháng trước) được tính toán đúng bằng hiệu của hai tổng thực tế này.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `ThuyetMinhL1/doGet/doGet_function.js` | Sửa | Thêm hàm tính tổng thực tế `doGet_getTotalSalarySums` và tích hợp vào `doGet_getDataPrint_CoThayDoi`. | 🟢 Thấp | Có |
| `ThuyetMinhL1/doGet/Code.js` | Sửa | Trả về `totalSums` trong response của `coThayDoi_DataPrint`. | 🟢 Thấp | Có |
| `ThuyetMinhL1/client/modal_dataluong_1.js` | Sửa | Cập nhật hàm `modal_dataluong_1_getDataPrint` để trả về cả `totalSums`. | 🟢 Thấp | Có |
| `ThuyetMinhL1/client/modal_dataluong_3.html` | Sửa | Nhận `totalSums` và truyền vào `openPrintWindow_ThuyetMinh` để render chân trang. | 🟢 Thấp | Có |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Đảm bảo hàm tính tổng sử dụng đúng logic lọc khu vực dựa trên `DataChotNSThang` đồng nhất với bảng dữ liệu in để tránh lệch số liệu khu vực.
- **Review focus areas:** Kiểm tra logic so khớp khu vực (chữ hoa/thường, cắt khoảng trắng đầu cuối).

## 8. Chiến lược triển khai

- **Phase strategy:**
  - Phase 1: Phát triển Backend API helper tính tổng thực tế và trả về qua doGet.
  - Phase 2: Phát triển Client-side tích hợp nhận kết quả tổng thực tế và hiển thị lên layout in thuyết minh lương.
- **Thứ tự triển khai:** Backend trước, Client sau.

## 9. Test Strategy

- **Manual verification:**
  - Chọn một tháng cụ thể (ví dụ: tháng 06/2026), chọn một khu vực cụ thể (ví dụ: Phú Thọ).
  - So sánh giá trị hiển thị ở chân trang Thuyết minh phần II (Tổng lương và truy lĩnh tháng T và T-1) với số liệu dòng tổng cộng của bảng "Tổng hợp lương" tương ứng trên màn hình chính. Hai số liệu này bắt buộc phải trùng khớp hoàn toàn.

## 10. Rollback Plan

- Khôi phục phiên bản code cũ bằng git hoặc bản backup tự động gần nhất.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
