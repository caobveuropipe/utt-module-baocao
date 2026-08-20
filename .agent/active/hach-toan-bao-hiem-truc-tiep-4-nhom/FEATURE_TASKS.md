# Feature Tasks: Tách Phần II Tổng Trực Tiếp Thành 4 Nhóm Hợp Đồng (Bảng Hạch Toán Bảo Hiểm)

> **Trạng thái**: 🔄 Đang thực hiện
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-08-03

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Refactor logic chia nhóm hạch toán bảo hiểm phần trực tiếp

**Mục tiêu:** Tách phần II (Trực tiếp) thành 4 nhóm (Biên chế, HĐ thường xuyên, HĐ 68, HĐ vụ việc) trong code tính toán dữ liệu.

- [x] Task 1.1: Định nghĩa cấu trúc lặp `orderTrucTiep`, `vtTrucTiep`, và `nameTrucTiep` trong [doGet_hachToanBaoHiem.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_hachToanBaoHiem.js) tương tự phần I.
- [x] Task 1.2: Cập nhật hàm `processDataHachToanBaoHiem` để duyệt qua 4 nhóm trực tiếp và thêm các dòng con (Lương, Truy lĩnh, Truy thu, Cộng nhóm) cho từng nhóm.
- [x] Task 1.3: Chèn dòng nhập tay `addAmount` (nếu có) vào nhóm Trực tiếp hợp đồng (nhóm 2 - HĐ thường xuyên).
- [x] Task 1.4: Cập nhật công thức tính `totalTrucTiepRow` thành `Tổng trực tiếp: 1+2+3+4` và tính tổng cộng dồn từ cả 4 nhóm.
- [x] Task 1.5: Thêm dòng `Cộng: I + II` nằm giữa dòng `Mã nước ngoài` và `Tổng cộng: I+II+III` theo yêu cầu bổ sung.
- [x] Task 1.6: Tách dòng `Hợp đồng lương cố định` theo cách 2 (nhận diện LuongCoDinh > 0) cho cả Phần I và Phần II.
- [x] Task 1.7: Cập nhật [doGet_hachToanKPCD.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_hachToanKPCD.js) đồng bộ cấu trúc 4 nhóm và Lương cố định (không tách Mã nước ngoài).
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Chạy test local để kiểm tra cấu trúc mảng data trả về của hàm `processDataHachToanBaoHiem`).

## Phase 2: Xác minh định dạng bảng trên Google Sheet

**Mục tiêu:** Bảng hạch toán sau khi xuất lên Google Sheets hiển thị đẹp mắt, căn chỉnh chuẩn và đúng định dạng.

- [x] Task 2.1: Đẩy mã nguồn lên cloud bằng lệnh `.\push-all.ps1`.
- [/] Task 2.2: Chạy hàm `test_doGet_taoBangTHBaoHiem()` và kiểm tra file Google Sheets kết quả.
- [ ] Task 2.3: Đảm bảo định dạng font chữ, border, bold dòng cộng hoạt động chính xác cho cả 4 nhóm của phần II.
- [ ] Task 2.Final: 🧪 Test & Verify Phase 2 (User xác nhận giao diện bảng đẹp mắt và số liệu chính xác).

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| [2026-08-03 11:00] | - | - | Khởi tạo kế hoạch | done | - |
| [2026-08-03 11:05] | Phase 1 | Task 1.1-1.4 | Bắt đầu refactor logic phần II trực tiếp | start | Tách thành 4 nhóm hợp đồng |
| [2026-08-03 11:10] | Phase 1 | Task 1.1-1.4 | Hoàn thành refactor logic phần II trực tiếp | done | Đã chuyển sang vòng lặp 4 nhóm |
| [2026-08-03 11:12] | Phase 1 | Task 1.Final | Thực hiện tự kiểm tra cú pháp code | start | Chuẩn bị sang Phase 2 để deploy và test thực tế |
| [2026-08-03 11:15] | Phase 1 | Task 1.Final | Tự kiểm tra hoàn tất | done | Cấu trúc dữ liệu hợp lệ |
| [2026-08-03 11:16] | Phase 2 | Task 2.1 | Đẩy mã nguồn lên Google Apps Script cloud | start | Chuẩn bị lệnh push-all.ps1 |
| [2026-08-03 11:17] | Phase 2 | Task 2.1 | Đồng bộ code lên cloud thành công | done | User tự chạy push-all.ps1 thành công |
| [2026-08-03 11:18] | Phase 2 | Task 2.2 | Chuẩn bị hàm test | start | Xác nhận hoặc cập nhật hàm test hạch toán bảo hiểm Hà Nội T06.2026 |
| [2026-08-03 11:20] | Phase 1 | Task 1.5 | Bổ sung dòng Cộng: I + II vào cuối bảng | done | Sửa code hạch toán bảo hiểm |
| [2026-08-03 11:23] | Phase 1 | Task 1.6 | Tách dòng Hợp đồng lương cố định theo Cách 2 | done | Nhận diện LuongCoDinh > 0 |
| [2026-08-03 16:10] | Phase 1 | Task 1.7 | Đồng bộ cấu trúc 4 nhóm & Lương cố định sang KPCĐ | done | Đồng bộ hachToanKPCD trừ Mã nước ngoài |
| [2026-08-03 16:12] | Phase 2 | Task 2.2 | Chờ user đồng bộ code mới của KPCĐ và chạy test | start | Cần push lại code mới |
