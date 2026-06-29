# Feature Plan: Khắc phục lệch số liệu Bảng đi ngân hàng L1 và Bảng tổng hợp lương

> **Trạng thái**: ⏳ CHỜ REVIEW
> **Review gate**: Khuyến nghị gọi `feature-review` để phản biện logic nghiệp vụ kế toán
> **Feature slug**: fix-bank-transfer-print-index
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-05-21
> **RCA nguồn**: check-issue (lệch số liệu do khấu trừ trùng lặp Đoàn phí KPCĐ)

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Về mặt nghiệp vụ, dòng Tổng cộng của cột Tổng số trên **Bảng đi ngân hàng (Thuyết minh L1)** và dòng **"I. TIỀN LƯƠNG (1+2+3+4)"** trên **Bảng tổng hợp lương** đều có nguồn gốc từ thực lĩnh lương L1 (`TongLuong1` trong sheet `DataLuong1` và các khoản truy thu `truyThuL1` được lưu trong sheet `DatabaseL1` dưới dạng cột `LuongTL`). Do đó, hai số liệu tổng cộng này bắt buộc phải khớp nhau 100%.
- **Vấn đề cần giải quyết:** Hiện tại hai số liệu này đang bị lệch một lượng bằng đúng tổng tiền Đoàn phí KPCĐ. Nguyên nhân gốc rễ là do lỗi **khấu trừ trùng lặp** tiền Đoàn phí KPCĐ ở Backend L1 trong hàm `doGet_getDataPrint_KhongThayDoi` (file `ThuyetMinhL1/doGet/doGet_function.js`):
  1. Cột 4 (`Tổng số`) bị trừ tiếp `dDoan` (`soTien - dDoan`), trong khi `soTien` lấy từ database vốn đã là số thực nhận nét (đã trừ sẵn đoàn phí).
  2. Tổng phụ cấp `tongPC` cộng cả `dDoan`, khiến việc phân rã cột 5 (`luongPC`) và cột 6 (`tienCongLD`) bị trừ trùng Đoàn phí thêm một lần nữa.
- **Mục tiêu:** Khắc phục triệt để lỗi khấu trừ trùng lặp Đoàn phí ở backend L1 để khớp hoàn toàn số liệu giữa hai bảng, đồng thời khôi phục và giữ nguyên hiện trạng an toàn cho các file Client L1 và toàn bộ Module L2.
- **Kết quả mong đợi:** Bản in Bảng đi ngân hàng L1 (in tất cả hoặc in theo khu vực) có dòng Tổng cộng khớp chính xác từng đồng với dòng I. TIỀN LƯƠNG trên Bảng tổng hợp lương tương ứng.

## 2. Phạm vi

### In scope
- Sửa đổi logic tính toán cột 4 (`Tổng số`), cột 5 (`Lương & PC theo lương`), và cột 6 (`Tiền công LĐ TX theo HĐ`) trong hàm `doGet_getDataPrint_KhongThayDoi` tại `ThuyetMinhL1/doGet/doGet_function.js`.
- Loại bỏ Đoàn phí `dDoan` khỏi tổng phụ cấp `tongPC` khi phân rã chi tiết để tránh trừ trùng.

### Out of scope
- Không chỉnh sửa các file HTML client (`modal_dataluong_3.html` của L1 đã map chuẩn 14 cột).
- Không chỉnh sửa bất kỳ file nào của Module ThuyetMinhL2 (L2 có cấu trúc in độc lập và không bị ảnh hưởng bởi lỗi này). Khôi phục hoàn toàn hiện trạng của L2.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** Tôn trọng cấu trúc 3-module (client, doGet, doPost) và chia sẻ logic qua LibraryDigiCore. Bảo toàn logic Gom nhóm theo Loại hợp đồng và Phân loại khu vực ổn định trên bản in.

## 4. Giả định và câu hỏi mở

### Giả định
- **G1:** Cột `LuongTL` trong sheet `DatabaseL1` đã là số thực lĩnh nét chốt chuyển ngân hàng và khớp với nguồn `DataLuong1`.
- **G2:** Việc giữ cột 10 (`Đ.Đoàn`) trống `''` trên bản in L1 là yêu cầu nghiệp vụ cố định (không hiển thị số liệu Đoàn phí chi tiết trên bản in này).

### Câu hỏi mở
- Không có câu hỏi mở blocking.

## 5. Acceptance Criteria

- [ ] **AC1:** Cột 4 (`Tổng số`) trên Bảng đi ngân hàng L1 hiển thị đúng thực lĩnh nét `soTien` (không bị trừ thêm `dDoan`).
- [ ] **AC2:** Phân rã cột 5 (`Lương & PC theo lương`) và cột 6 (`Tiền công LĐ TX`) chính xác bằng cách chỉ trừ đi các phụ cấp thực tế (Ngành, Độc hại, Trách nhiệm), không trừ thêm Đoàn phí.
- [ ] **AC3:** Tổng cộng các cột chi tiết hiển thị (cột 5 + 6 + 7 + 8 + 9) khớp chính xác 100% với cột 4 (`Tổng số`).
- [ ] **AC4:** Dòng Tổng cộng của cột 4 trên bản in Bảng đi ngân hàng L1 (in tất cả / in theo khu vực) khớp 100% dòng I. TIỀN LƯƠNG trên Bảng tổng hợp lương tương ứng.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `ThuyetMinhL1/doGet/doGet_function.js` | Sửa | Loại bỏ khấu trừ trùng Đoàn phí ở hàm `doGet_getDataPrint_KhongThayDoi` | 🟡 | Không |
| `ThuyetMinhL2/...` | Khôi phục / Không chạm | Không thuộc phạm vi lỗi lệch tiền L1 | 🟢 | Không |
| `ThuyetMinhL1/client/...` | Không chạm | Giao diện client đã map đúng sẵn 14 cột | 🟢 | Không |

## 7. Risk Triage và Review Focus

- **Review required:** Khuyến nghị (nhất là việc đối chiếu tổng các cột chi tiết).
- **Risk hotspots:** Đảm bảo khi loại bỏ `dDoan` khỏi `tongPC` dùng để tính cột 5, 6, thì phép cộng `luongPC + tienCongLD + pcNganh + pcDocHai + pcTrachNhiem + '' (Đ.Đoàn trống)` phải đúng bằng cột 4 (`soTien`).
  - Phép tính toán: `soTien - (pcNganh + pcDocHai + pcTrachNhiem) + pcNganh + pcDocHai + pcTrachNhiem = soTien`. Hoàn toàn chính xác!

## 8. Chiến lược triển khai

- **Phase strategy:** 1 Phase duy nhất tập trung sửa Backend L1, deploy qua clasp và phối hợp in thử nghiệm.
- **Thứ tự triển khai:**
  1. Sửa code `ThuyetMinhL1/doGet/doGet_function.js`.
  2. Deploy lên Apps Script.
  3. Kiểm tra số liệu in thực tế trên môi trường web.

## 9. Test Strategy

- **Manual verification:**
  1. In thử Bảng đi ngân hàng L1 (tất cả / theo khu vực), ghi nhận dòng "Tổng cộng" của cột "Tổng số".
  2. Mở Bảng tổng hợp lương L1 (tổng tiền / theo khu vực tương ứng), ghi nhận dòng "I. TIỀN LƯƠNG".
  3. Đối chiếu hai số liệu để xác định khớp chính xác 100%.
  4. Đảm bảo tổng các cột chi tiết trên bản in đi ngân hàng cộng lại bằng đúng cột Tổng số.

## 10. Rollback Plan

- Khôi phục hàm `doGet_getDataPrint_KhongThayDoi` về phiên bản lưu vết gần nhất.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
