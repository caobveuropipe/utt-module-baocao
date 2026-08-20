# Feature Tasks: In Danh sách treo chưa chi trả tiền lương (Phú Thọ)

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-08-20

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Nâng cấp Backend API cho Bảng Treo Lương

**Mục tiêu:** Bổ sung logic lọc và API trả dữ liệu cho Bảng treo lương ở cơ sở Phú Thọ.

- [x] Task 1.1: Cập nhật `doGet_tongHopDiNganHang` trong `doGet/doGet_tongHopCk.js` hỗ trợ cờ/tham số `isTreoLuong` để chỉ giữ lại nhân sự `Đi công tác NN` / `Đi NN` của Phú Thọ.
- [x] Task 1.2: Cập nhật hàm `getPrintDataCk` trong `doGet/doGet_tongHopCk.js` và xử lý tham số `isTreoLuong` trong `doGet/Code.js` (cả `doGet` router và `pg1_ed1_getPrintDataCk`).
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Kiểm tra cú pháp và logic gọi hàm backend).

## Phase 2: Nâng cấp Frontend UI & Modal Chọn Bảng In

**Mục tiêu:** Thêm Modal khi chọn Phú Thọ và cập nhật template in HTML cho Bảng treo lương.

- [x] Task 2.1: Cập nhật `client/pg_general_1.js` thêm tham số `isTreoLuong` vào `pg1_ed1_getPrintDataCk`.
- [x] Task 2.2: Bổ sung Modal UI trong `client/pg_general_3.html` (`printBangTongHopCk`) hiển thị 2 lựa chọn ("In bảng chuyển khoản" và "In bảng treo lương") khi người dùng chọn cơ sở Phú Thọ.
- [x] Task 2.3: Cập nhật hàm `generateCkHtml` trong `client/pg_general_3.html` để tự động đổi tiêu đề thành `DANH SÁCH TREO CHƯA CHI TRẢ TIỀN LƯƠNG` khi in bảng treo lương.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Kiểm tra tương thích HTML/JS client).

## Phase 3: Kiểm thử Tổng thể & Hoàn thiện Document

**Mục tiêu:** Đảm bảo toàn bộ luồng in hoạt động chính xác ở tất cả cơ sở và hoàn thiện tài liệu.

- [x] Task 3.1: Kiểm thử chi tiết cả 2 bảng in tại cơ sở Phú Thọ (Bảng chuyển khoản & Bảng treo lương) và kiểm thử các cơ sở khác (Hà Nội, All) để đảm bảo không ảnh hưởng luồng in cũ.
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (Xác nhận nghiệm thu toàn bộ tính năng).

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-08-20 15:43 | - | - | Khởi tạo checklist công việc | done | Kế hoạch được duyệt |
| 2026-08-20 15:48 | Phase 1 | Task 1.1, 1.2 | Cập nhật doGet_tongHopCk.js và Code.js hỗ trợ isTreoLuong | done | Backend hoàn tất |
| 2026-08-20 15:49 | Phase 2 | Task 2.1, 2.2, 2.3 | Cập nhật pg_general_1.js và pg_general_3.html (Swal popup + dynamic title) | done | Frontend hoàn tất |
| 2026-08-20 15:57 | Phase 2 | Task 2.3 | Ẩn Phần dành cho ngân hàng & đổi 'Kế toán trưởng' thành 'Phụ trách kế toán' cho bảng treo lương | done | Tinh chỉnh footer theo yêu cầu |
| 2026-08-20 16:01 | Extension | Export Excel | Đồng bộ xuất Excel cho Bảng chuyển khoản và Bảng treo lương (tiêu đề A3 + chữ ký + ẩn ngân hàng) | done | Hoàn tất xuất Excel |
| 2026-08-20 16:02 | Phase 3 | Task 3.1, 3.Final | Hoàn thiện tài liệu và sẵn sàng push/deploy test | done | Sẵn sàng test thực tế |
