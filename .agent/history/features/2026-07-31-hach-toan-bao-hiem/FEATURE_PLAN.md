# Feature Plan: Bảng Hạch Toán Bảo Hiểm

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Đã thông qua review gate, sẵn sàng triển khai
> **Feature slug**: `hach-toan-bao-hiem`
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-07-27

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Bảng Hạch toán bảo hiểm hiện tại cần cập nhật logic bóc tách dữ liệu và cấu trúc các dòng chỉ tiêu ở phần NGƯỜI LAO ĐỘNG TRẢ & NHÀ TRƯỜNG TRẢ để khớp chuẩn với BẢNG KÊ HẠCH TOÁN LƯƠNG VÀ TRUY LĨNH LƯƠNG.
- **Vấn đề cần giải quyết:** 
  - Cần chia chi tiết các mục I (Gián tiếp), II (Trực tiếp), và bổ sung mục III (Mã nước ngoài).
  - Phân tách chính xác nguồn dữ liệu (`DataLuong1` và `DataTruyThuLinh` của Lương 1) theo điều kiện Loại hợp đồng (Biên chế, HĐ dài hạn, HĐ 68, HĐ vụ việc), Loại chi phí (Gián tiếp, Trực tiếp) và trạng thái Đi công tác NN.
  - Loại bỏ / điều chỉnh ở phần NGƯỜI LAO ĐỘNG TRẢ tương ứng với logic bóc tách mới.
- **Mục tiêu:** Cập nhật hàm xử lý hạch toán bảo hiểm (`doGet_hachToanBaoHiem.js`) đảm bảo bóc tách đúng nguồn, đúng nhóm hợp đồng, đúng điều kiện còn nhận > 0 (Truy lĩnh) / < 0 (Truy thu), và lọc tách nhân sự Đi công tác NN xuống mục III.
- **Kết quả mong đợi:** Bảng Hạch toán bảo hiểm trả về đúng các chỉ tiêu I.1-I.4, II.1-II.2 (có mục III Mã nước ngoài), tổng tiền khớp chính xác với Bảng tổng hợp bảo hiểm / Hạch toán lương.

## 2. Phạm vi

### In scope
- Cập nhật logic lọc và bóc tách nhân sự trong [`doGet_hachToanBaoHiem.js`](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_hachToanBaoHiem.js) **sử dụng toàn bộ thông tin nhân sự (Loại hợp đồng, Mã đơn vị/Bộ phận, Khu vực/Địa phương, Trạng thái) được tra cứu đồng bộ từ `DataChotNSThang` (bảng nhân sự chốt)** tương tự như `doGet_hachToanLuongVaTruyLinh.js`:
  - **Mục I: Gián tiếp** (Loại chi phí = Gián tiếp tra cứu từ Setup qua Mã đơn vị chốt):
    - Phần 1: Gián tiếp biên chế (Loại HD: Biên chế, nguồn `DataLuong1`) + Truy lĩnh (nguồn `DataTruyThuLinh`, còn nhận > 0) + Truy thu (nguồn `DataTruyThuLinh`, còn nhận < 0).
    - Phần 2: Gián tiếp hợp đồng (Loại HD: HĐ dài hạn, nguồn `DataLuong1`) + Truy lĩnh (nguồn `DataTruyThuLinh`, còn nhận > 0).
    - Phần 3: Gián tiếp hợp đồng 68 (Loại HD: HĐ 68, nguồn `DataLuong1`) + Truy lĩnh (nguồn `DataTruyThuLinh`, còn nhận > 0).
    - Phần 4: Gián tiếp hợp đồng vụ việc (Loại HD: HĐ vụ việc, nguồn `DataLuong1`) + Truy lĩnh (nguồn `DataTruyThuLinh`, còn nhận > 0).
  - **Mục II: Trực tiếp** (Loại chi phí = Trực tiếp, trừ các nhân sự có trạng thái là Đi công tác NN):
    - Phần 1: Trực tiếp biên chế (Loại HD: Biên chế, nguồn `DataLuong1`) + Truy lĩnh (nguồn `DataTruyThuLinh`, còn nhận > 0) + Truy thu (nguồn `DataTruyThuLinh`, còn nhận < 0).
    - Phần 2: Trực tiếp hợp đồng (Loại HD: HĐ dài hạn, nguồn `DataLuong1`) + Truy lĩnh (nguồn `DataTruyThuLinh`, còn nhận > 0).
  - **Mục III: Mã nước ngoài**: Các nhân sự Trực tiếp có trạng thái là "Đi công tác NN" (xác định từ cột Trạng thái trong `DataChotNSThang`) đã trừ ở Mục II.
- Cập nhật/giữ nguyên tỷ lệ % tính toán bảo hiểm (BHXH, BHYT, BHTN cho NLĐ và Nhà trường).
- Cập nhật cấu trúc template Excel / PDF xuất ra tương ứng, hiển thị đúng các dòng mục I, II, III, Cộng I+II và Tổng cộng I+II+III.

### Out of scope
- Thay đổi tỷ lệ đóng bảo hiểm (RATES BHXH/BHYT/BHTN).
- Sửa đổi cấu trúc sheet `Setup` hoặc `DataLuong1` / `DataTruyThuLinh`.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** 
  - Sử dụng Sheets Advanced Service / cấu trúc tối ưu đọc dữ liệu để tránh timeout GAS.
  - Tuân thủ quy tắc đồng bộ địa phương (Khu vực Hà Nội / Vĩnh Phúc / All) khi bóc tách nhân sự.
- **"Cấm kỵ" cần tránh:** Tuyệt đối không thay đổi contract hàm API public `doGet_taoBangHachToanBaoHiem(monthStr, location)`.
- **Ràng buộc kiến trúc liên quan:** Tất cả các hàm helper tra cứu nhân sự (`getContractType`, `getUnitCode`, `getUnitType`, lọc `KhuVuc`, lọc `TrangThai`) phải lấy từ đối tượng `personnel` (tra cứu từ `DataChotNSThang`) giống 100% với [`doGet_hachToanLuongVaTruyLinh.js`](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_hachToanLuongVaTruyLinh.js).

## 4. Giả định và câu hỏi mở

### Giả định
- Toàn bộ thông tin gốc của nhân sự (Loại HD, Mã đơn vị, Khu vực, Trạng thái) trong kỳ báo cáo được ghi nhận chính thức và chuẩn xác nhất tại `DataChotNSThang`.

### Câu hỏi mở
- None.

## 5. Acceptance Criteria

- [ ] Thông tin Loại hợp đồng, Mã đơn vị, Khu vực và Trạng thái nhân sự được tra cứu hoàn toàn từ `DataChotNSThang`.
- [ ] Mục I (Gián tiếp) hiển thị đủ 4 phần (Biên chế, HĐ dài hạn, HĐ 68, HĐ vụ việc) với các dòng Truy lĩnh / Truy thu đúng điều kiện nguồn dữ liệu và giá trị còn nhận (>0 là Truy lĩnh, <0 là Truy thu).
- [ ] Mục II (Trực tiếp) chỉ tính các nhân sự không thuộc trạng thái "Đi công tác NN" (cột Trạng thái trong `DataChotNSThang`).
- [ ] Mục III (Mã nước ngoài) tách riêng và tổng hợp đầy đủ các nhân sự có trạng thái "Đi công tác NN" bị trừ từ Mục II.
- [ ] Phần NGƯỜI LAO ĐỘNG TRẢ & NHÀ TRƯỜNG TRẢ tính đúng theo tỷ lệ % và giá trị tiền bảo hiểm tương ứng.
- [ ] Dòng "Cộng: I+II" và "Tổng cộng: I+II+III" hiển thị chính xác số liệu và có định dạng font đậm, đường viền đúng quy chuẩn.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| [`doGet/doGet_hachToanBaoHiem.js`](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_hachToanBaoHiem.js) | Sửa | Cập nhật logic tra cứu thông tin nhân sự (LoaiHD, MaBP, KhuVuc, TrangThai) từ `DataChotNSThang`, bóc tách `DataLuong1`, `DataTruyThuLinh`, xử lý "Đi công tác NN", sửa dấu Truy lĩnh/Truy thu và cập nhật render Excel | 🔴 Logic hạch toán tài chính | Có |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** 
  - Tra cứu nhân sự đồng bộ từ `DataChotNSThang` (đảm bảo fallback `allPersonnelRecords` nếu không tìm thấy trong tháng).
  - Phân tách đúng điều kiện còn nhận `>0` (Truy lĩnh) vs `<0` (Truy thu) từ nguồn `DataTruyThuLinh`.
  - Tách nhân sự có trạng thái "Đi công tác NN" ở cột Trạng thái (`DataChotNSThang`) ra khỏi Mục II để chuyển xuống Mục III.
- **Review focus areas:** 
  - Đảm bảo tính toán tổng tiền cho các dòng cha và dòng tổng cộng cuối cùng (`Cộng: I+II`, `Tổng cộng: I+II+III`) khớp hoàn hảo với dữ liệu chi tiết.

## 8. Chiến lược triển khai

- **Phase strategy:** 
  - Phase 1: Xây dựng bản đồ nhân sự `personnel` & `allPersonnelRecords` đọc từ `DataChotNSThang` (lấy LoaiHD, MaBP, KhuVuc, TrangThai). Áp dụng các helper `getContractType`, `getUnitCode`, `getUnitType` đồng bộ với module Hạch toán lương. Xử lý bóc tách Mục I, II, III (Mã nước ngoài) và phân chia chuẩn xác Truy lĩnh (>0) / Truy thu (<0).
  - Phase 2: Cập nhật hàm tạo dòng kết quả, render các chỉ tiêu I, II, III, tính toán dòng "Cộng: I+II", "Tổng cộng: I+II+III" và ghi dữ liệu lên Google Sheets.
  - Phase 3: Kiểm thử dữ liệu audit & đối chiếu tổng tiền với Bảng Hạch toán Lương.
- **Thứ tự triển khai:** Phase 1 -> Phase 2 -> Phase 3.

## 9. Test Strategy

- **Automated tests:** Chạy hàm test `test_doGet_taoBangTHBaoHiem()` trong GAS.
- **Manual verification:** Xuất file Bảng Hạch toán bảo hiểm tháng T06.2026 / T01.2025 và so sánh cột tổng với Bảng Hạch toán Lương.

## 10. Rollback Plan

- Restore phiên bản cũ của [`doGet_hachToanBaoHiem.js`](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_hachToanBaoHiem.js) từ Git/Local Backup nếu có sai lệch số liệu.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
