# Feature Plan: Tách Phần II Tổng Trực Tiếp Thành 4 Nhóm Hợp Đồng (Bảng Hạch Toán Bảo Hiểm)

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Khuyến nghị gọi `feature-review` trước khi thực thi
> **Feature slug**: hach-toan-bao-hiem-truc-tiep-4-nhom
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-08-03

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại, Bảng tổng hợp hạch toán bảo hiểm có phần I (Gián tiếp) được chia nhỏ thành 4 nhóm hợp đồng (Biên chế, HĐ thường xuyên, HĐ 68, HĐ vụ việc), nhưng phần II (Trực tiếp) chỉ được chia thành 2 nhóm: Trực tiếp biên chế và Trực tiếp hợp đồng (gộp cả 3 loại HĐ còn lại).
- **Vấn đề cần giải quyết:** Sự không đồng nhất giữa phần I và phần II gây khó khăn cho việc đối chiếu và báo cáo chi tiết theo từng loại hợp đồng ở phần trực tiếp.
- **Mục tiêu:** Tách phần II (Tổng trực tiếp) thành 4 nhóm hợp đồng tương tự phần I.
- **Kết quả mong đợi:** 
  - Phần II hiển thị đầy đủ 4 nhóm hợp đồng: Trực tiếp biên chế, Trực tiếp hợp đồng, Trực tiếp hợp đồng 68, Trực tiếp hợp đồng vụ việc.
  - Tổng số tiền phần II tính bằng tổng của 4 nhóm (1+2+3+4).
  - Dòng nhập tay (nếu có) được cộng đúng vào nhóm Trực tiếp hợp đồng (nhóm 2) hoặc xử lý phù hợp để không làm sai lệch tổng số tiền.
  - Báo cáo xuất ra Google Sheets hoạt động trơn tru, đúng định dạng và căn chỉnh (bold/border).

## 2. Phạm vi

### In scope
- Sửa hàm `processDataHachToanBaoHiem` trong file [doGet_hachToanBaoHiem.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_hachToanBaoHiem.js):
  - Thay đổi logic render phần II từ tách 2 nhóm thành tách 4 nhóm.
  - Tính toán lại tổng trực tiếp `totalTrucTiepRow = 1+2+3+4`.
  - Giữ nguyên logic xử lý dữ liệu đầu vào.
- Cập nhật định dạng hoặc border của bảng nếu có thay đổi về số dòng.

### Out of scope
- Các bảng hạch toán khác như Kinh phí công đoàn ([doGet_hachToanKPCD.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_hachToanKPCD.js)) không thuộc phạm vi xử lý trực tiếp lần này trừ khi có yêu cầu thêm từ User.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - Quy định tối ưu hiệu năng [2026-06-25] trong [KNOWLEDGE_BASE.md](file:///d:/Project/UoTT/Dikhobac/.agent/KNOWLEDGE_BASE.md): Bắt buộc sử dụng Sheets Advanced Service cho việc đọc dữ liệu lớn (đã được triển khai ở các hàm load dữ liệu bên ngoài, chúng ta kế thừa phần đó).
- **"Cấm kỵ" cần tránh:**
  - Không thay đổi cấu trúc dữ liệu thô (Master Data, DataLuong1, v.v.). Chỉ thay đổi cách tổng hợp hiển thị.
- **Ràng buộc kiến trúc liên quan:**
  - Giữ nguyên các contract định dạng trong [doGet_hachToanBaoHiem.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_hachToanBaoHiem.js) (font family, font size, border solid cho dòng Bold/Cộng).

## 4. Giả định và câu hỏi mở

### Giả định
- Dòng nhập tay (`addContent` và `addAmount`) nếu có, sẽ được cộng dồn vào nhóm 2 (Trực tiếp hợp đồng - HĐ thường xuyên) tương tự logic cũ.
- Tên các dòng trong Phần II sau khi tách sẽ được chuẩn hóa thành:
  - 1: Trực tiếp biên chế -> Cộng trực tiếp BC
  - 2: Trực tiếp hợp đồng -> Cộng trực tiếp HĐ
  - 3: Trực tiếp hợp đồng 68 -> Cộng trực tiếp HĐ 68
  - 4: Trực tiếp hợp đồng vụ việc -> Cộng trực tiếp HĐ vụ việc

### Câu hỏi mở
- *Chưa có câu hỏi mở blocking.*

## 5. Acceptance Criteria

- [ ] Phần II trong bảng hạch toán bảo hiểm hiển thị 4 nhóm con được đánh số từ 1 đến 4.
- [ ] Dòng tiêu đề phần II đổi thành: `Tổng trực tiếp: 1+2+3+4`.
- [ ] Số liệu của từng nhóm (Biên chế, HĐ thường xuyên, HĐ 68, HĐ vụ việc) phần trực tiếp được tính toán chính xác từ `aggTrucTiep`.
- [ ] Cột STT, Nội dung, và các số tiền của các dòng cộng và dòng chi tiết hiển thị đúng vị trí và định dạng (Bold dòng cộng, định dạng số hàng nghìn).
- [ ] Xuất file Excel thành công không bị lệch dòng hay sai công thức tính tổng cộng.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| [doGet_hachToanBaoHiem.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_hachToanBaoHiem.js) | Sửa | Thay đổi cấu trúc phần II trong hàm `processDataHachToanBaoHiem` | 🟢 Thấp | Có (giữ nguyên định dạng đầu ra) |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:**
  - Việc lặp qua 4 nhóm trực tiếp cần đảm bảo không bỏ sót dòng nhập tay `addAmount` (nếu có).
  - Vị trí chèn dòng nhập tay phải chính xác trong mảng kết quả của nhóm 2.
- **Review focus areas:**
  - Logic tính `totalTrucTiepRow` và `grandTotalRow` đảm bảo cộng đúng tất cả các nhóm mới.
  - Border và styling của các dòng mới thêm có tự động áp dụng đúng theo STT và từ khóa "Cộng" không.

## 8. Chiến lược triển khai

- **Phase strategy:** 
  - **Phase 1:** Refactor hàm `processDataHachToanBaoHiem` để sinh cấu trúc dữ liệu mới cho phần II.
  - **Phase 2:** Xác minh định dạng bảng trên Google Sheet sau khi xuất để đảm bảo thẩm mỹ (border, font size, căn lề).
- **Thứ tự triển khai:**
  1. Cập nhật mã nguồn phần II trong `doGet_hachToanBaoHiem.js` theo cấu trúc lặp tương tự phần I.
  2. Test xuất báo cáo qua clasp/Apps Script và review file kết quả.

## 9. Test Strategy

- **Manual verification:**
  - Chạy hàm `test_doGet_taoBangTHBaoHiem()` trực tiếp từ Apps Script editor hoặc gọi API để xuất báo cáo tháng bất kỳ (ví dụ `T06.2026`).
  - Kiểm tra trực quan file Sheet kết quả: cấu trúc phần II có đủ 4 nhóm, tổng trực tiếp bằng tổng 4 nhóm, tổng cộng cuối cùng khớp số liệu cũ.

## 10. Rollback Plan

- Khôi phục file [doGet_hachToanBaoHiem.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_hachToanBaoHiem.js) về trạng thái trước khi sửa (sử dụng backup local hoặc git checkout).

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
