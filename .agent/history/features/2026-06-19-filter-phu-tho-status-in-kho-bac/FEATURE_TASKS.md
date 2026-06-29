# Feature Tasks: Lọc nhân sự có trạng thái khi in bảng đi kho bạc Phú Thọ

> **Trạng thái**: 🔄 Đang thực hiện
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-06-19


---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Nạp cột Trạng thái từ DataChotNSThang

**Mục tiêu:** Hàm `doGet_tongHopDiNganHang` đọc được thông tin Trạng thái của từng nhân viên chốt tháng.

- [x] Task 1.0: Tạo bản sao lưu (backup) thủ công cho file `doGet_tongHopCk.js` vào thư mục `backup/` cục bộ.
- [x] Task 1.1: Sửa chỉ mục `idx7` trong `doGet_tongHopCk.js` để tự động dò vị trí cột `Trạng thái` (`TrangThai`) sử dụng danh sách alias. Nếu chọn địa phương Phú Thọ và không tìm thấy cột (`idx7.TrangThai === -1`), hệ thống phải throw lỗi rõ ràng để chặn xuất báo cáo (FR-03).
- [x] Task 1.2: Cập nhật vòng lặp xử lý `data7` để trích xuất `trangThai` từ mỗi dòng (sử dụng `.trim()` để xử lý khoảng trắng - FR-01) và lưu vào `maDonViMap` & `employeeMap`.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Chạy dry-run hoặc log thử dữ liệu chốt nhân sự tháng xem đã load thành công trường `trangThai` chưa).

## Phase 2: Áp dụng logic lọc Phú Thọ có trạng thái

**Mục tiêu:** Loại bỏ các bản ghi có trạng thái khi in/xuất Phú Thọ.

- [x] Task 2.1: Sửa logic tạo mảng `output` trong `doGet_tongHopDiNganHang` theo trình tự chuẩn (lọc địa phương -> lấy `emp` -> check `!emp` -> check lọc Phú Thọ có trạng thái và log chi tiết Mã NS, Họ tên, Trạng thái - FR-02).
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Đảm bảo việc lọc không ảnh hưởng khi chọn địa phương khác như Hà Nội hay All).

## Phase 3: Deploy & Kiểm tra thực tế

**Mục tiêu:** Đồng bộ code lên cloud và kiểm định tính đúng đắn trên ứng dụng.

- [x] Task 3.1: Chạy `.\push-all.ps1` để đẩy code Apps Script lên Google Cloud.
- [x] Task 3.2: Thực hiện kiểm tra thủ công (Manual Verification) trên Web App sử dụng Dev URL (`/dev` - FR-04):
  - Trường hợp 1: In bảng đi kho bạc Phú Thọ -> Check xem nhân sự có trạng thái bị loại bỏ chưa.
  - Trường hợp 2: Xuất Excel Phú Thọ -> Check file tải về và tổng tiền.
  - Trường hợp 3: In/Xuất cho Hà Nội -> Đảm bảo các nhân sự có trạng thái của Hà Nội vẫn hiển thị bình thường.
  - Trường hợp 4: In/Xuất cho Tất cả địa phương (`All`) -> Đảm bảo các nhân sự Phú Thọ có trạng thái vẫn hiển thị bình thường (không bị lọc mất).
  - Trường hợp 5: Giả lập đổi tên cột `Trạng thái` trong sheet (Quy trình an toàn: đổi nhanh trong thời gian ngắn hoặc dùng sheet test copy, verify chặn và báo lỗi UI, rồi lập tức restore tên cột gốc về như cũ).
- [ ] Task 3.3: Sau khi kiểm thử thành công trên dev URL, cập nhật bản Deploy chính thức bằng `deploy-all.ps1` nếu cần.
- [ ] Task 3.Final: 🧪 Test & Verify Phase 3 (Đảm bảo deploy thành công và chức năng hoạt động đúng nghiệp vụ mong muốn).

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-06-19 09:30 | Phase 1 | Khởi tạo | Tạo kế hoạch | done | |
| 2026-06-19 10:02 | Phase 1 | Task 1.0 | Bắt đầu sao lưu file code | start | |
| 2026-06-19 10:03 | Phase 1 | Task 1.0 | Đã sao lưu file code thành công | done | backup/doGet_tongHopCk.js.20260619_1002.bak |
| 2026-06-19 10:03 | Phase 1 | Task 1.1 | Sửa chỉ mục idx7 và xử lý throw lỗi khi thiếu cột | start | |
| 2026-06-19 10:05 | Phase 1 | Task 1.1 | Hoàn thành sửa idx7 và thêm throw check | done | |
| 2026-06-19 10:05 | Phase 1 | Task 1.2 | Trích xuất trangThai trong vòng lặp data7 và lưu vào map | start | |
| 2026-06-19 10:07 | Phase 1 | Task 1.2 | Đã hoàn thành lưu trangThai cho nhân sự | done | |
| 2026-06-19 10:07 | Phase 1 | Task 1.Final | Thực hiện dry-run để log thử thông tin TrangThai của nhân sự | start | |
| 2026-06-19 10:19 | Phase 1 | Task 1.Final | Hoàn tất Phase 1 với xác nhận của User | done | |
| 2026-06-19 10:19 | Phase 2 | Task 2.1 | Sửa logic tạo output để lọc Phú Thọ có trạng thái và ghi log | start | |
| 2026-06-19 10:21 | Phase 2 | Task 2.1 | Hoàn thành sửa logic lọc và ghi log | done | |
| 2026-06-19 10:21 | Phase 2 | Task 2.Final | Thực hiện rà soát dry-run logic lọc cho Phú Thọ / Hà Nội / All | start | |
| 2026-06-19 10:22 | Phase 2 | Task 2.Final | Hoàn tất Phase 2 (Logic chính xác cho mọi trường hợp lựa chọn địa phương) | done | |
| 2026-06-19 10:22 | Phase 3 | Task 3.1 | Đồng bộ code lên GAS cloud | start | |
| 2026-06-19 10:23 | Phase 3 | Task 3.1 | Đồng bộ code lên GAS cloud (Người dùng thực hiện thủ công) | done | |
| 2026-06-19 10:23 | Phase 3 | Task 3.2 | Thực hiện kiểm tra thủ công trên Web App Dev URL | start | Chờ người dùng thực hiện kiểm tra và cung cấp phản hồi |
| 2026-06-19 11:17 | Phase 3 | Task 3.2 | User xác nhận Dev OK | done | Tất cả trường hợp test đạt |








