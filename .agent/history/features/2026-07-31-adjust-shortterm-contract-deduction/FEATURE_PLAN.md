# Feature Plan: Điều chỉnh trừ lương và truy lĩnh HĐ ngắn hạn

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Khuyến nghị gọi `feature-review` để kiểm tra độ chính xác của công thức hạch toán
> **Feature slug**: adjust-shortterm-contract-deduction
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-07-31

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Bảng kê hạch toán lương và truy lĩnh lương cần điều chỉnh cơ cấu khấu trừ đối với Hợp đồng ngắn hạn (HĐ ngắn hạn) để tách bạch phần Trực tiếp và Gián tiếp.
- **Vấn đề cần giải quyết:** 
  1. Thiếu dòng "Tổng truy lĩnh HĐ N.hạn-TT" dưới dòng "Tổng truy lĩnh HĐ N.hạn-GT" trong phần hạch toán (phần 3 của báo cáo). Dòng này cần lấy giá trị từ mục HĐ ngắn hạn của phần "2. Trực tiếp".
  2. Dòng "Tổng lương ngạch bậc và truy lĩnh-GT" chưa trừ đi dòng "Tổng truy lĩnh HĐ N.hạn-GT".
  3. Dòng "Tổng lương ngạch bậc và truy lĩnh-TT" chưa trừ đi dòng "Tổng truy lĩnh HĐ N.hạn-TT".
- **Mục tiêu:** Cập nhật công thức tính toán và cấu trúc dòng trong cả hàm xử lý chính `doGet_processHachToanLuongVaTruyLinh` và hàm audit `test_chiTietThanhPhanHachToanLuong`.
- **Kết quả mong đợi:** 
  - Báo cáo xuất ra Excel/PDF và dữ liệu in ấn có cấu trúc dòng đúng yêu cầu.
  - Các giá trị tính toán trừ đúng quy tắc mới.

## 2. Phạm vi

### In scope
- Sửa đổi hàm `doGet_processHachToanLuongVaTruyLinh` và `test_chiTietThanhPhanHachToanLuong` trong file [doGet_hachToanLuongVaTruyLinh.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_hachToanLuongVaTruyLinh.js).
- Thêm dòng "Tổng truy lĩnh HĐ N.hạn-TT" ở phần hạch toán của cả 2 hàm.
- Cập nhật logic trừ của dòng "Tổng lương ngạch bậc và truy lĩnh-GT" và "Tổng lương ngạch bậc và truy lĩnh-TT" ở cả 2 hàm.
- Đảm bảo định dạng, kẻ viền (border), màu nền cho dòng mới thêm được áp dụng đúng.

### Out of scope
- Thay đổi cấu trúc dữ liệu đầu vào hoặc thay đổi cách tính toán phân loại HĐ ngắn hạn ở các phần khác ngoài phần 3 (Mục tổng hợp lương ngạch bậc và truy lĩnh).

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** Giữ nguyên cấu trúc dữ liệu và cách lấy thông tin qua `getVal` / `getValTest` từ `storage`.
- **"Cấm kỵ" cần tránh:** Tránh làm sai lệch dữ liệu của các phần khác (Phần I, II, B, C, D) khi cập nhật logic trừ.
- **Ràng buộc kiến trúc liên quan:** Giữ nguyên các hàm `getRow` và định dạng ô/kẻ bảng để không phá vỡ layout báo cáo.

## 4. Giả định và câu hỏi mở

### Giả định
- Dòng "Tổng truy lĩnh HĐ N.hạn-TT" (tương tự như dòng "-GT") sẽ lấy tổng của `HĐ ngắn hạn` trực tiếp (Regular + TL + TT).
- Công thức tính `totalA` (A. Tổng lương ngạch bậc và truy lĩnh GT+TT) sẽ cộng dồn các dòng tổng hợp sau khi đã trừ (hoặc theo công thức toán học hợp lý để khớp tổng).

### Câu hỏi mở
- Không có câu hỏi blocking.

## 5. Acceptance Criteria

- [ ] Thêm dòng `"Tổng truy lĩnh HĐ N.hạn-TT"` ngay dưới dòng `"Tổng truy lĩnh HĐ N.hạn-GT"`.
- [ ] Dòng `"Tổng truy lĩnh HĐ N.hạn-TT"` lấy đúng giá trị `HĐ ngắn hạn` của mục `"2. Trực tiếp"`.
- [ ] Dòng `"Tổng lương ngạch bậc và truy lĩnh-GT"` = (Tổng lương ngạch bậc GT + Tổng truy lĩnh GT) - `"Tổng truy lĩnh HĐ N.hạn-GT"`.
- [ ] Dòng `"Tổng lương ngạch bậc và truy lĩnh-TT"` = (Tổng lương ngạch bậc TT + Tổng truy lĩnh TT) - `"Tổng truy lĩnh HĐ N.hạn-TT"`.
- [ ] Cả sheet báo cáo chính (`THHachToanLuong`) và sheet audit (`Audit_HachToanLuong`) đều hiển thị đúng cấu trúc và tính toán chính xác.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| [doGet_hachToanLuongVaTruyLinh.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_hachToanLuongVaTruyLinh.js) | Sửa | Thêm dòng mới, điều chỉnh logic tính toán của 3 dòng tổng | 🟡 Cần kiểm tra kỹ các phép tính cộng/trừ để không lệch số liệu tổng cộng cuối cùng | Không |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Phép trừ trong `sumTotalGT` và `sumTotalTT` có thể ảnh hưởng đến `totalA` và `grand` (Tổng cộng: A+B+C-D). Cần xác định xem `totalA` có nên cộng dồn `nhGt` và `nhTt` vào hay không.
  - *Hiện tại:* `totalA` được tính bằng `addMetrics(totalA, sumTotalGT); addMetrics(totalA, sumTotalTT); addMetrics(totalA, nhGt);`
  - *Cần làm rõ:* Nếu `sumTotalGT` đã bị trừ `nhGt`, thì khi tính `totalA` ta có cần cộng lại `nhGt` và `nhTt` để ra tổng thực tế hay không.
- **Review focus areas:** Tính chính xác của số liệu dòng "Tổng cộng: A+B+C-D" sau khi thay đổi logic.

## 8. Chiến lược triển khai

- **Phase strategy:** Triển khai một phase duy nhất do phạm vi thay đổi nhỏ và tập trung tại một file duy nhất.
- **Thứ tự triển khai:**
  1. Cập nhật logic trong `doGet_processHachToanLuongVaTruyLinh` để hiển thị trên báo cáo chính.
  2. Cập nhật logic trong `test_chiTietThanhPhanHachToanLuong` để hiển thị trên báo cáo audit.
  3. Kiểm tra bằng cách chạy thử test và xuất file.
- **Yêu cầu migration / config / deploy:** Đẩy code lên bằng `.\push-all.ps1`.

## 9. Test Strategy

- **Automated tests:** Không có test tự động, chạy các hàm test có sẵn như `test_doGet_taoBangHachToanLuongVaTruyLinh()` and `test_chiTietThanhPhanHachToanLuong()`.
- **Manual verification:**
  - So sánh file Excel/PDF xuất ra trước và sau khi sửa để kiểm tra sự chênh lệch và vị trí dòng.
  - Xác nhận các công thức tính toán trừ đúng số tiền HĐ ngắn hạn tương ứng.

## 10. Rollback Plan

- Khôi phục file [doGet_hachToanLuongVaTruyLinh.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_hachToanLuongVaTruyLinh.js) về trạng thái commit trước đó của Git.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
