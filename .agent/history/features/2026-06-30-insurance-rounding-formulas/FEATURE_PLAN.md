# Feature Plan: Bảng tổng hợp bảo hiểm - Làm tròn và dùng công thức SUBTOTAL

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Khuyến nghị gọi `feature-review` để phản biện logic công thức
> **Feature slug**: insurance-rounding-formulas
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-06-30

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Bảng tổng hợp bảo hiểm xã hội, y tế, thất nghiệp (BHXH, BHYT, BHTN) được sinh ra bằng cách tổng hợp dữ liệu từ bảng lương (`DataLuong1`) và bảng truy thu (`DataTruyThu`).
- **Vấn đề cần giải quyết:** 
  1. Hiện tại, các giá trị bảo hiểm khi tính toán và ghi vào sheet chứa số thập phân, dẫn đến chênh lệch làm tròn giữa tổng các ô hiển thị và ô tổng cộng thực tế.
  2. Các ô tính tổng (theo hàng dọc, hàng ngang, tổng nhóm, tổng cộng) đang điền giá trị tĩnh (hằng số), khiến người dùng khi tải file Excel về không thể tự động tính toán lại hoặc điều chỉnh số liệu.
- **Mục tiêu:**
  1. Làm tròn tất cả các ô giá trị chi tiết về hàng đơn vị (`Math.round`) trước khi thực hiện các phép cộng tổng.
  2. Thay thế các giá trị tĩnh ở các ô/cột tính tổng bằng công thức Excel (`SUBTOTAL` và các công thức toán học phù hợp) khi fill vào Google Sheets để người dùng tải về có thể tái tính toán được.
- **Kết quả mong đợi:** File Excel xuất ra hiển thị số tròn trịa, các ô tổng có công thức chính xác, khớp 100% về mặt toán học.

## 2. Phạm vi

### In scope
- Sửa hàm `doGet_tongHopBaoHiem` và `doGet_taoBangTongHopBaoHiem` trong [doGet_tongHopBaoHiem.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_tongHopBaoHiem.js) để:
  - Thực hiện làm tròn các giá trị chi tiết (BHXH, BHYT, BHTN của cả NLĐ và Nhà trường) về hàng đơn vị.
  - Điền công thức Excel (dưới dạng chuỗi bắt đầu bằng `=`) thay vì số tĩnh vào các ô tính tổng hàng dọc, hàng ngang, tổng nhóm, và tổng cộng.
- Đảm bảo Google Sheets nhận diện đúng công thức và xuất sang Excel hoạt động bình thường.

### Out of scope
- Thay đổi cấu trúc cơ sở dữ liệu nguồn (`DataLuong1`, `DataTruyThu`).
- Thay đổi các bảng báo cáo khác (ví dụ: KPCĐ, lương) trừ khi có yêu cầu riêng.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** Giữ nguyên cấu trúc phân nhóm (Diện biên chế, Diện HĐLĐ thường xuyên, Diện HĐ 68, Diện HĐ vụ việc) và các mã đặc biệt (LA, HW) trong logic tổng hợp.
- **"Cấm kỵ" cần tránh:** Tránh ghi đè trực tiếp các ô tổng cộng bằng giá trị tĩnh. Bắt buộc dùng công thức.
- **Ràng buộc kiến trúc liên quan:** Phải dùng đúng các tỷ lệ đóng bảo hiểm cấu hình trong `RATES`.

## 4. Giả định và câu hỏi mở

### Giả định
- Các dòng dữ liệu chi tiết của từng nhóm luôn cố định về vị trí hàng (row index) sau khi xuất ra, cho phép ta tính toán chính xác địa chỉ ô (ví dụ: `E8`, `F8`) để tạo chuỗi công thức Excel tương ứng.
- Tỷ lệ đóng BHXH, BHYT, BHTN là cố định như trong cấu hình `RATES`.

### Câu hỏi mở
- *Không có.*

## 5. Acceptance Criteria

- [ ] Các giá trị chi tiết về tiền bảo hiểm của NLĐ và Nhà trường được làm tròn đến hàng đơn vị trước khi tính tổng.
- [ ] Cột "Thành tiền" của NLĐ (Cột H) sử dụng công thức `=SUBTOTAL(9, E[row]:G[row])`.
- [ ] Các cột bảo hiểm của Nhà trường (Cột I, J, K) sử dụng công thức tính dựa trên NLĐ:
  - BHXH Trường (Cột I): `=ROUND(E[row] * 17.5 / 8, 0)`
  - BHYT Trường (Cột J): `=ROUND(F[row] * 3 / 1.5, 0)`
  - BHTN Trường (Cột K): `=ROUND(G[row] * 1 / 1, 0)`
- [ ] Cột "Thành tiền" của Nhà trường (Cột L) sử dụng công thức `=SUBTOTAL(9, I[row]:K[row])`.
- [ ] Cột "Tổng tiền" (Cột M) sử dụng công thức `=H[row]+L[row]`.
- [ ] Các dòng tổng nhóm (I, II, III, IV) sử dụng công thức `=Luong - TruyLinh + TruyThu` tương ứng: `=[row+1] - [row+2] + [row+3]`.
- [ ] Dòng "Cộng" cuối bảng 1 sử dụng công thức `SUBTOTAL` để cộng các dòng tổng nhóm (I, II, III, IV): `=SUBTOTAL(9, E[group1], E[group2], E[group3], E[group4])`.
- [ ] Các dòng trong phần tách mã (LA, HW) sử dụng công thức phù hợp tương tự. Tên các mã hiển thị theo khu vực được ánh xạ cụ thể:
  - Với Phú Thọ: `Mã LA0001A (đi nước ngoài)` và `Mã HW0004A`.
  - Với Hà Nội: `Mã LA0001N (đi nước ngoài)` và `Mã HW0013N`.
  - Các trường hợp khác: Mặc định `Mã LA... (đi nước ngoài)` và `Mã HW03889`.
- [ ] Xuất file Excel tải về chạy tốt, thay đổi ô chi tiết thì các ô tổng tự động cập nhật lại.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `doGet/doGet_tongHopBaoHiem.js` | Sửa | Chỉnh sửa logic tính toán (làm tròn trước) và ghi công thức thay vì giá trị tĩnh | 🟢 Thấp | Có |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:**
  - Vị trí hàng (Row Index): Cần tính toán chính xác chỉ số hàng trong Google Sheets (bắt đầu từ dòng 7) để ánh xạ đúng vào các ô trong công thức Excel.
  - Xử lý giá trị khi tính toán trong JS: Cần làm tròn trước khi đưa vào logic tính tổng phụ trong code (để hiển thị/log chính xác nếu cần), nhưng quan trọng nhất là điền công thức đúng vào sheet.
- **Review focus areas:** 
  - Đảm bảo công thức Excel sinh ra đúng cú pháp (ví dụ: `=SUBTOTAL(9, E8:G8)`).
  - Đảm bảo định dạng số `#,##0` hiển thị chính xác các giá trị tính bằng công thức.

## 8. Chiến lược triển khai

- **Phase strategy:** 
  - **Phase 1:** Sửa logic tính toán trong `doGet_tongHopBaoHiem` để làm tròn số trước.
  - **Phase 2:** Cập nhật hàm ghi dữ liệu để sinh công thức Excel thay vì điền số tĩnh.
  - **Phase 3:** Chạy thử nghiệm và xác minh trên file test.
- **Thứ tự triển khai:** Cập nhật file code -> Test verify -> Review và chốt.

## 9. Test Strategy

- **Automated tests:** Không có (sử dụng chạy thử hàm test có sẵn).
- **Manual verification:**
  - Chạy hàm `test_doGet_taoBangTongHopbaoHiem()` để tạo bảng bảo hiểm kỳ mới nhất.
  - Kiểm tra trực tiếp trên Google Sheet xem các ô tổng cộng có hiển thị đúng công thức (ví dụ kích đúp vào ô xem có công thức `=SUBTOTAL...` không).
  - Tải file Excel về máy, thay đổi thử một số liệu chi tiết để xem các ô tổng có tự động cập nhật số liệu mới không.

## 10. Rollback Plan

- Sử dụng Git để phục hồi trạng thái file `doGet_tongHopBaoHiem.js` về phiên bản trước khi sửa đổi.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
