# Feature Plan: Treo Lương Nhân Sự Đi Nước Ngoài Phú Thọ

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: User bỏ qua review với rủi ro đã nêu / Đã hội tụ qua expert-rebuttal
> **Feature slug**: treo-luong-phu-tho-nn
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-06-25

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Ở khu vực Phú Thọ, các nhân sự đi nước ngoài (đi NN) không được in trong bảng Lương 1.
- **Vấn đề cần giải quyết:** Hiện tại, bảng Tổng hợp lương chưa có cơ chế hiển thị riêng các nhân sự đi NN của Phú Thọ. Khi tính tổng hợp, cần tách các nhân sự này thành từng dòng riêng có tên "Treo lương : + Họ và tên" nằm dưới diện hợp đồng tương ứng của họ, thay vì gộp chung vào các dòng lương chính (1.1, 2.1, 3.1...). Số tiền của họ phải được tổng hợp riêng thành một dòng treo lương tương tự các dòng khác nhưng dành riêng cho mã cán bộ đó.
- **Mục tiêu:**
  - Tự động nhận diện nhân sự đi NN của Phú Thọ dựa vào danh sách chốt nhân sự tháng (`DataChotNSThang`) với trạng thái là "Đi NN" hoặc "Đi công tác NN".
  - Tách số tiền của các nhân sự này ra khỏi các dòng tính toán chuẩn (như 1.1-1.5, 2.1-2.2, 3.1-3.3, 4., và Sections II, III, IV).
  - Ghi nhận thành các dòng `Treo lương : <Họ và tên>` dưới diện hợp đồng tương ứng (như Biên chế, HĐ 68, HĐ dài hạn, HĐ vụ việc).
  - Đảm bảo tổng số tiền vẫn được tính đúng vào tổng diện hợp đồng, tổng phần I và tổng cộng cuối cùng của bảng.

## 2. Phạm vi

### In scope
- Sửa đổi hàm `doGet_tongHopLuong` trong [doGet_tongHopLuong.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_tongHopLuong.js) để:
  - Load và lưu thông tin `trangThai` từ `DataChotNSThang`.
  - Phân loại nhân sự Phú Thọ đi NN (`location === 'Phú Thọ' && (trangThai === 'Đi NN' || trangThai === 'Đi công tác NN')`).
  - Tổng hợp số tiền NET của từng nhân sự đi NN: `net = Lương 1 + Truy lĩnh L1 - Truy thu L1 + Lương 2 + Truy lĩnh L2 - Truy thu L2 + Ăn ca + Truy lĩnh AC - Truy thu AC - Thuế TNCN`.
  - Loại trừ các số tiền thành phần của nhân sự này khỏi các dòng tính toán chuẩn (như 1.1-1.5, 2.1-2.2, 3.1-3.3, 4., và Sections II, III, IV).
  - Cộng số tiền NET này trực tiếp vào tổng của diện hợp đồng tương ứng (`totals[contractType].tong`) để tự động bubble up lên dòng tổng và tổng cộng.
  - Chèn dòng `Treo lương : <Họ và tên>` vào vị trí phù hợp trong output array.

### Out of scope
- Thay đổi cấu trúc dữ liệu của các file dữ liệu nguồn (`DataLuong1`, `DataLuong2`, `DataChotNSThang`).
- Thay đổi các báo cáo khác ngoài Bảng tổng hợp lương (trừ khi có yêu cầu thêm).

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** Tôn trọng việc sử dụng `normalizeLocation` để lọc và chuẩn hóa khu vực.
- **"Cấm kỵ" cần tránh:** Không làm thay đổi kết quả tổng cộng cuối cùng của bảng lương khi so sánh với tổng chuyển khoản (vì tổng số tiền thực tế không đổi, chỉ thay đổi cách trình bày dòng treo lương).
- **Ràng buộc kiến trúc liên quan:** Phải giữ nguyên cấu trúc cột của kết quả trả về từ `doGet_tongHopLuong` (6 cột: STT, NỘI DUNG, TỔNG TIỀN, HÀ NỘI, VĨNH PHÚC/PHÚ THỌ, GHI CHÚ) để không làm lỗi phần render/in ấn ở client.

## 4. Giả định và câu hỏi mở

### Giả định
- Trạng thái đi NN của nhân sự Phú Thọ được xác định khi `khuVuc` sau khi normalize là `'Phú Thọ'` và cột `Trạng thái` trong `DataChotNSThang` có giá trị là `'Đi NN'` hoặc `'Đi công tác NN'`.
- Tên hiển thị dòng treo lương sẽ có định dạng `Treo lương : <Họ tên>` (Ví dụ: `Treo lương : Vương Tùng Lâm`).

## 5. Acceptance Criteria

- [ ] Các nhân sự Phú Thọ có trạng thái "Đi NN" hoặc "Đi công tác NN" được hiển thị thành một dòng riêng `Treo lương : <Họ tên>` dưới mục diện hợp đồng tương ứng.
- [ ] Số tiền ở dòng treo lương này là tổng số tiền thực nhận (NET) của nhân viên đó.
- [ ] Số tiền của nhân viên này không còn nằm trong các dòng chi tiết khác (1.1, 2.1, 3.1... và các mục II, III, IV).
- [ ] Tổng cộng của diện hợp đồng, mục I và Cộng cuối cùng vẫn chính xác (bao gồm cả dòng treo lương này).

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| [doGet_tongHopLuong.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_tongHopLuong.js) | Sửa | Thêm logic lọc nhân sự Phú Thọ đi NN, tính tiền NET riêng và chèn dòng treo lương. | 🟡 Trung bình (có thể ảnh hưởng tổng hợp số tiền nếu công thức sai) | Chưa |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Tính sai công thức NET của cán bộ đi NN dẫn tới sai lệch số tiền tổng hợp.
- **Review focus areas:** Cách xác định trạng thái khác "Đang làm" và cách cộng dồn vào `totals[contractType].tong`.

## 8. Chiến lược triển khai

- **Phase strategy:**
  - Phase 1: Thu thập `trangThai` từ `DataChotNSThang` và phân loại nhân sự Phú Thọ đi NN.
  - Phase 2: Điều chỉnh logic tính toán tổng hợp (cộng dồn riêng số tiền NET vào diện hợp đồng, loại trừ khỏi các dòng chi tiết).
  - Phase 3: Chèn dòng treo lương vào output array ở vị trí chính xác.
- **Thứ tự triển khai:** Cập nhật logic trong `doGet_tongHopLuong.js`, chạy thử hàm test tại local để kiểm tra data output.

## 9. Test Strategy

- **Manual verification:**
  - Chạy hàm `testZ_taobangTHLuong()` cho một kỳ lương cụ thể có nhân sự Phú Thọ đi NN (ví dụ kỳ T05.2026 có Vương Tùng Lâm).
  - Xác nhận dòng `Treo lương : Vương Tùng Lâm` xuất hiện với đúng số tiền và đúng vị trí.
  - So sánh tổng cộng cuối cùng trước và sau khi sửa để đảm bảo không bị lệch tiền.

## 10. Rollback Plan

- Khôi phục file `doGet_tongHopLuong.js` về phiên bản backup trước đó.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
