# Feature Plan: Tách cột PCTN thành PC TN và PC TV

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: User bỏ qua review với rủi ro đã nêu
> **Feature slug**: split-pctn-column
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-07-31

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Báo cáo "BẢNG KÊ HẠCH TOÁN LƯƠNG VÀ TRUY LĨNH LƯƠNG" hiện đang gộp chung Phụ cấp trách nhiệm (PC TN) và Phụ cấp tự vệ (PC TV) vào một cột duy nhất là `PCTN`.
- **Vấn đề cần giải quyết:** Cần hiển thị tách biệt hai cột này trên bảng kê hạch toán lương và truy lĩnh để phục vụ mục đích kiểm toán và quản lý chi tiết:
  - Cột `PC TN` (Phụ cấp trách nhiệm): Tính từ hệ số trách nhiệm (Cột R trong `DataLuong1`).
  - Cột `PC TV` (Phụ cấp tự vệ): Tính từ hệ số tự vệ (Cột S trong `DataLuong1`).
- **Mục tiêu:** Tách cột dữ liệu `PCTN` hiện tại thành hai cột `PC TN` và `PC TV` trên cả phần tính toán (backend) và giao diện kết xuất (sheet Excel, PDF).
- **Kết quả mong đợi:** 
  - Bảng kê hạch toán lương xuất ra Excel/PDF sẽ có 22 cột thay vì 21 cột, trong đó cột `PCTN` cũ được thay thế bởi `PC TN` và `PC TV`.
  - Các công thức tính tổng lương phụ cấp (`SumLPC`) và thực lĩnh (`ThucLinh`) cộng cả hai khoản phụ cấp này một cách chính xác.

## 2. Phạm vi

### In scope
- Cập nhật hàm `emptyMetric`, `sumMetricRow`, `addMetrics` trong `doGet/doGet_hachToanLuongVaTruyLinh.js` để hỗ trợ trường `PCTV` mới bên cạnh `PCTN`.
- Sửa logic xử lý `DataLuong1` và `TruyThu1` để bóc tách riêng biệt giá trị `pctn` và `pctv`.
- Cập nhật cấu trúc Header (dòng 5 & 6) trong `doGet_taoBangHachToanLuongVaTruyLinh` và `test_chiTietThanhPhanHachToanLuong`:
  - Thêm cột `PC TV` vào sau cột `PC TN`.
  - Điều chỉnh merge range để ôm trọn cột mới (`G5:L5` cho phụ cấp, `M5:U5` cho khấu trừ, v.v.).
  - Cập nhật số lượng cột từ 21 thành 22.

### Out of scope
- Sửa đổi cấu trúc của các bảng lương khác không liên quan trực tiếp đến Bảng kê Hạch toán Lương và Truy lĩnh.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** Giữ nguyên kiến trúc 3-module và cơ chế dùng chung config của `GLOBAL_CONFIG.FILES.EXPORT_HT_TH_LUONG_VA_TTTL`.
- **"Cấm kỵ" cần tránh:** Tránh hardcode vị trí cột mà không thông qua cơ chế dynamically map index (`getIdx`) để đề phòng vị trí các cột trong sheet `DataLuong1` thay đổi.

## 4. Giả định và câu hỏi mở

### Giả định
- Trong `dataLuong1`, hệ số tự vệ nằm ở cột S và hệ số trách nhiệm nằm ở cột R. Cơ chế `getIdx` với các từ khóa `HSTrachNhiem` / `HSTuVe` sẽ ánh xạ đúng.
- Trong sheet `TruyThu1` (hoặc chênh lệch lương truy lĩnh), nếu có cột tiền tự vệ riêng hoặc hệ số tự vệ riêng thì sẽ map tương tự.

### Câu hỏi mở
- *Không có câu hỏi blocking.*

## 5. Acceptance Criteria

- [ ] Sheet kết quả `THHachToanLuong` hiển thị cột `PC TN` và `PC TV` cạnh nhau dưới nhóm "Các khoản phụ cấp theo lương".
- [ ] Tổng cộng phụ cấp và thực lĩnh ở dòng cuối cùng khớp chính xác với tổng số của cả PC trách nhiệm và PC tự vệ.
- [ ] Xuất PDF và Excel hoạt động bình thường, định dạng căn lề, border và nét vẽ bảng không bị lệch cột.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `doGet/doGet_hachToanLuongVaTruyLinh.js` | Sửa | Tách cột PCTN thành hai cột PC TN & PC TV | 🟡 Trung bình | Có |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Định dạng vẽ border và merge các ô tiêu đề trên Google Sheets. Nếu tính toán số lượng cột (22 thay vì 21) bị sai lệch sẽ dẫn đến lỗi hiển thị hoặc lệch cột ở các phần tiếp theo (như Khấu trừ, Thuế, Thực lĩnh).
- **Review focus areas:** 
  - Đảm bảo merge range `G5:L5` (Phụ cấp) và `M5:U5` (Khấu trừ) được cập nhật chính xác.
  - Các hàm tính tổng (`sumMetricRow`, `addMetrics`) phải cộng đầy đủ trường `PCTV` mới.

## 8. Chiến lược triển khai

- **Phase strategy:** 
  - Phase 1: Cập nhật cấu trúc dữ liệu (`emptyMetric`, `sumMetricRow`) và logic phân tách phụ cấp trách nhiệm/tự vệ từ nguồn `DataLuong1`/`TruyThu1`.
  - Phase 2: Cập nhật Header và định dạng hiển thị bảng tính Excel/PDF (22 cột).
  - Phase 3: Test & Verify qua hàm `test_chiTietThanhPhanHachToanLuong`.

## 9. Test Strategy

- **Automated tests:** Chạy trực tiếp hàm `test_doGet_taoBangHachToanLuongVaTruyLinh()` và `test_chiTietThanhPhanHachToanLuong('T06.2026', 'Hà Nội')` để xuất dữ liệu audit ra Google Sheets.
- **Manual verification:** Kiểm tra trực quan file Excel/PDF kết xuất để đảm bảo cột tự vệ và trách nhiệm hiển thị đúng số liệu tương ứng với cột R và S trong `DataLuong1`.

## 10. Rollback Plan

- Sử dụng `git checkout` hoặc phục hồi từ file backup tự động nếu phát hiện lỗi nghiêm trọng.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
