# Feature Plan: Khắc phục lỗi lấp số và wrap text trên các dòng Tổng/Cộng khi in báo cáo

> **Trạng thái**: ✅ ĐỒNG Ý  
> **Review gate**: Hội đồng đã phê duyệt, sẵn sàng triển khai qua feature-coordinator  
> **Feature slug**: fix-print-table-overflow-and-wrap  
> **Tạo bởi**: feature-plan  
> **Ngày tạo**: 2026-08-19  
> **Ngày review**: 2026-08-19 (Verdict: ✅ ĐỒNG Ý)  

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Khi người dùng thực hiện in 3 loại báo cáo lương và bảo hiểm từ WebApp (`client/pg_general_3.html`), các dòng Tổng, Cộng, Tổng cộng xuất hiện các giá trị số lớn (hàng trăm triệu, hàng tỷ đồng). Do độ rộng cột chưa tối ưu và CSS padding/white-space chưa phù hợp, một số ô bị lấp số (bị cắt mất ký tự cuối do `overflow: hidden`) hoặc bị ngắt chữ/xuống dòng số (wrap text: 1 chữ số rớt xuống dòng dưới) gây mất thẩm mỹ và khó đọc khi in ấn.
- **Vấn đề cần giải quyết:**
  1. **Hình 1 - BẢNG TỔNG HỢP NỘP BẢO HIỂM XÃ HỘI, BHYT, BHTN (`generateTongHopBaoHiemHtml`):** Cột "BHXH 17.5%", "Thành tiền", "Tổng tiền" khi có giá trị tiền tỷ (vd: `1.059.172.613`, `1.048.215.211`) bị rớt số hàng đơn vị xuống dòng 2 (vd: `1.059.172.61` ở dòng 1 và `3` ở dòng 2) do thiếu `white-space: nowrap` và độ rộng cột 80px chưa đủ rộng.
  2. **Hình 2 - BẢNG PHÂN BỔ TIỀN LƯƠNG VÀ BẢO HIỂM XÃ HỘI (`generateGenericReportHtml` - 23 cột):** Các cột giảm trừ / chi trả (như `34.746.192`, `17.571.060`) ở dòng tổng cộng bị tràn viền hoặc bị lấp số do padding ngang của ô (6px) chiếm quá nhiều diện tích khả dụng trong cột hẹp (48px - 55px).
  3. **Hình 3 - BẢNG KÊ HẠCH TOÁN LƯƠNG VÀ TRUY LĨNH LƯƠNG (`generateGenericReportHtml` - 22 cột):** Dòng `A. Tổng lương ngạch bậc và truy lĩnh GT+TT` và `Tổng cộng: A+B+C-D` tại các cột phụ cấp (PCĐH `1.119.871.800`, PCTN `617.407.900`, PCVK `66.784.770`, PCGV `21.738.600`) bị dính chữ số, lấp số hoặc rớt chữ số do cột chỉ rộng 55px - 60px và font-size dòng in đậm chưa co giãn linh hoạt.
- **Mục tiêu:** Tối ưu hóa layout in ấn, độ rộng từng cột (colgroup), padding ô, kích thước font chữ và thuộc tính chống xuống dòng số (`white-space: nowrap !important`) để tất cả các dòng (đặc biệt là dòng Tổng/Cộng) hiển thị đầy đủ, sắc nét, không bị lấp số, không ngắt số trên trang in A4 Portrait & Landscape.
- **Kết quả mong đợi:** 
  - 100% các ô chứa số liệu trên 3 bảng in không bị ngắt xuống dòng số.
  - Các số lớn (tiền trăm triệu, tiền tỷ) hiển thị trọn vẹn trong ô, cách đều viền kẻ bảng.
  - Giữ nguyên cấu trúc dữ liệu, tỷ lệ trang A4 chuẩn (Portrait/Landscape) và các phần chữ ký cuối bảng.

## 2. Phạm vi

### In scope
- Chỉnh sửa logic render HTML bản in trong `client/pg_general_3.html`:
  - Hàm `generateTongHopBaoHiemHtml`: Tối ưu colgroup 11 cột, thêm `white-space: nowrap !important`, điều chỉnh font-size và padding ô số liệu.
  - Hàm `generateGenericReportHtml`:
    - Nhánh 23 cột (Bảng phân bổ lương BHXH): Tái phân bổ độ rộng 23 cột, giảm padding `.phanbo-table td`, tối ưu font size cho dòng in đậm `bold-row`.
    - Nhánh 22 cột (Bảng kê hạch toán lương và truy lĩnh): Tái phân bổ độ rộng 22 cột (đặc biệt nới rộng các cột phụ cấp PCĐH, PCTN, PCVK, PCGV), giảm padding ô, điều chỉnh font size riêng cho các ô giá trị lớn.
- Kiểm tra tính tương thích khi in thử trên trình duyệt (Print Preview) ở cả 2 khổ giấy Portrait & Landscape.

### Out of scope
- Không thay đổi logic tính toán số liệu backend trong `doGet/doGet_tongHopBaoHiem.js`, `doGet/doGet_phanBoLuongBHXH.js`, `doGet/doGet_hachToanLuongVaTruyLinh.js`.
- Không thay đổi định dạng xuất file Excel (.xlsx) hay template spreadsheet trên Google Drive.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - Giữ nguyên kiến trúc client-side rendering bản in qua `HtmlService` và popup window `window.print()`.
  - Giữ chuẩn typography và bộ nhận diện trường học (Times New Roman / Tahoma, tiêu đề in hoa, khối chữ ký theo chức vụ).
- **"Cấm kỵ" cần tránh:**
  - Không làm vỡ layout in A4 hoặc phát sinh tràn trang ngang khiến thanh cuộn hoặc trang in bị cắt ngang mép phải.
  - Không phá vỡ định dạng số `vi-VN` (phân cách hàng nghìn bằng dấu `.`).
  - Không làm ảnh hưởng đến các báo cáo generic khác đang dùng chung hàm `generateGenericReportHtml` (như KPCĐ, Khoản khấu trừ).

## 4. Giả định và câu hỏi mở

### Giả định
- Khổ giấy in chuẩn:
  - Bảng Tổng hợp nộp BHXH, BHYT, BHTN: Khổ A4 Portrait (dọc).
  - Bảng Phân bổ tiền lương và BHXH: Khổ A4 Landscape (ngang).
  - Bảng Kê hạch toán lương và truy lĩnh lương: Khổ A4 Landscape (ngang).
- Việc giảm nhẹ kích thước font (từ 7.2pt xuống 6.8pt - 7.0pt cho các dòng số lớn trong bảng 22-23 cột) là phương án tối ưu được chấp nhận để đảm bảo tất cả 22-23 cột cùng nằm vừa vặn trên 1 trang ngang A4 mà không bị lấp số.

### Câu hỏi mở
- [Non-blocking] Người dùng có cần thêm tùy chọn tự điều chỉnh cỡ chữ in trực tiếp trên thanh công cụ in không, hay chỉ cần cấu hình chuẩn tự động fit trang in? (Tạm thời áp dụng chuẩn cấu hình tự động tối ưu).

## 5. Acceptance Criteria

- [ ] **Bảng Tổng hợp nộp BHXH (Hình 1):** Các ô số liệu (như `1.059.172.613`, `1.048.215.211`, `1.933.955.259`) tại cột BHXH 17.5% và cột Thành tiền/Tổng tiền hiển thị trọn vẹn trên 1 dòng duy nhất, không có hiện tượng rớt chữ số cuối xuống dòng 2.
- [ ] **Bảng Phân bổ tiền lương và BHXH (Hình 2):** Các số liệu dòng tổng cộng (như `34.746.192`, `17.571.060`, `639.138.792`, `5.715.821.508`) hiển thị rõ ràng, không bị đè viền, không bị cắt bớt số do `overflow`.
- [ ] **Bảng Kê hạch toán lương và truy lĩnh (Hình 3):** Các số liệu dòng `A.` và dòng `Tổng cộng: A+B+C-D` tại các cột phụ cấp (như `1.119.871.800`, `617.407.900`, `66.784.770`, `21.738.600`) hiển thị đầy đủ, không bị đè chữ, không bị cắt xén.
- [ ] Khung in ấn (Print preview) trên Google Chrome/Edge khớp hoàn hảo với trang in chuẩn A4, lề trang in chuẩn xác, chữ ký ở cuối bảng không bị đứt đoạn vô lý.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `client/pg_general_3.html` | Sửa | Điều chỉnh colgroup, CSS padding, font size, `white-space` trong `generateTongHopBaoHiemHtml` và `generateGenericReportHtml` | 🟢 Thấp | Giữ nguyên DOM structure và interface handler |

## 7. Risk Triage và Review Focus

- **Review required:** Yes (Khuyến nghị gọi `feature-review`)
- **Risk hotspots:**
  - Tương tác giữa `colgroup` (độ rộng cột cố định) và tính chất co giãn của CSS table `table-layout: fixed` khi in ấn trên các trình duyệt khác nhau.
  - Đảm bảo việc tái phân bổ độ rộng cột ở `generateGenericReportHtml` không làm lệch cột tiêu đề kép (multi-level headers) của Bảng Phân bổ (23 cột) và Bảng Hạch toán (22 cột).
- **Review focus areas:**
  - Các tỷ lệ độ rộng cột mới có đủ chỗ cho số liệu tối đa dự kiến (lên đến hàng chục tỷ: 14 ký tự `xx.xxx.xxx.xxx`) không?
  - CSS `@media print` zoom và margins có giữ đúng bố cục chuẩn trang in không?
- **Known pitfalls / historical issues:** Trình duyệt Chromium tự động ngắt dòng tại dấu chấm phân cách hàng nghìn (`.`) nếu ô không có thuộc tính `white-space: nowrap`.

## 8. Chiến lược triển khai

- **Phase strategy:** 2 Phase
  - **Phase 1:** Khắc phục lỗi ngắt số cho Bảng Tổng hợp nộp BHXH (Hình 1) trong `generateTongHopBaoHiemHtml`.
  - **Phase 2:** Khắc phục lỗi lấp số và đè viền cho Bảng Phân bổ (Hình 2) & Bảng Kê hạch toán lương (Hình 3) trong `generateGenericReportHtml`.
- **Thứ tự triển khai:**
  1. Chỉnh sửa CSS và colgroup cho `generateTongHopBaoHiemHtml` -> Test kiểm chứng Hình 1.
  2. Chỉnh sửa colgroup, padding và font-size cho nhánh 23 cột và 22 cột trong `generateGenericReportHtml` -> Test kiểm chứng Hình 2 và Hình 3.
  3. Kiểm tra hồi quy toàn diện các bảng in khác để đảm bảo không bị ảnh hưởng phụ.

## 9. Test Strategy

- **Automated tests:** N/A (Client-side HTML formatting).
- **Manual verification:**
  1. Mở WebApp -> Chọn tháng có dữ liệu thực tế -> Mở in từng bảng:
     - Bảng Tổng hợp nộp BHXH, BHYT, BHTN -> Kiểm tra cột BHXH 17.5% và các dòng Cộng.
     - Bảng Phân bổ tiền lương và BHXH -> Kiểm tra các cột giảm trừ ở dòng Tổng cộng.
     - Bảng Kê hạch toán lương và truy lĩnh -> Kiểm tra dòng A và dòng Tổng cộng tại các cột phụ cấp.
  2. Bật chế độ xem trước khi in (Print Preview Ctrl+P) để kiểm tra trên màn hình in thực tế.

## 10. Rollback Plan

- Git rollback hoặc khôi phục lại file `client/pg_general_3.html` từ commit trước đó.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`

## 12. Review Notes

- **2026-08-19 (Hội đồng Review):** Phê duyệt phương án (`✅ ĐỒNG Ý`). Đã tạo [`EXPERT_REVIEW.md`](./EXPERT_REVIEW.md) ghi nhận 3 khuyến nghị `Low` (cách ly điều kiện colgroup, test với số tiền tỷ >= 13 chữ số, dùng font sans-serif cho bảng in 22-23 cột). Sẵn sàng chuyển giao cho `feature-coordinator` triển khai.

