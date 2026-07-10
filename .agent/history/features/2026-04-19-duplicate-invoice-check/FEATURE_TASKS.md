# Feature Tasks: Kiểm tra trùng lặp mã hóa đơn khi upload

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-04-19

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Thêm logic Duplicate Check tại Backend

**Mục tiêu:** Backend có khả năng kiểm tra được danh sách các hóa đơn trong file tải lên có tồn tại trong `Sheet Data` của hệ thống hay không và trả về cảnh báo nếu chưa được xác nhận `force`.

- [x] Task 1.1: Sửa phương thức `uploadExcelFile` trong `Service_Import.gs` để lấy Index của Cột "Mã HĐ" hoặc "Số hóa đơn". Trích xuất tập `Mã HĐ` duy nhất từ dữ liệu `dataToImport`.
- [x] Task 1.2: Lấy dữ liệu của `Sheet Data` tương ứng năm, đọc cột "Mã HĐ" để tạo tập mã đã tồn tại. So khớp tìm ra danh sách các mã bị trùng lặp.
- [x] Task 1.3: Nếu danh sách trùng > 0 và `obj.force` không là `true`, trả về `return { status: 'duplicate_warning', count: X, duplicates: ['Mã A', 'Mã B']}` để ngăn chặn việc nhập dữ liệu. 
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc thiết lập mock call để test endpoint)

## Phase 2: Nâng cấp UI/UX Cảnh báo ở Front-end

**Mục tiêu:** Hiển thị cho người dùng danh sách mã bị trùng và hỏi ý kiến tiếp tục hay hủy bỏ.

- [x] Task 2.1: Bổ sung code ở Proxy `client/Code.gs` nhận thêm tham số `force` và truyền xuống `doPost` dưới dạng `obj.force`.
- [x] Task 2.2: Sửa lý phản hồi từ `uploadSingleFile` trong `client/scripts.html`. Khi `res.status === 'duplicate_warning'`, thiết lập logic render HTML Table trực tiếp chứa các mã hóa đơn bị trùng trên giao diện.
- [x] Task 2.3: Hiển thị hộp thoại Swal cảnh báo ĐỎ nhấn mạnh nguy cơ "bị double dữ liệu do các mã này đã được upload trước đó" kèm theo bảng danh sách các mã trùng.
- [x] Task 2.4: Ràng buộc action "Tiếp tục ghi" gọi phương thức `uploadSingleFile` với tham số `force: true`.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Gửi thử file giả lập trùng, xem hiệu ứng bật Popup, nội dung cảnh báo thay vì tải file CSV).

## Phase 3: Hoàn thiện nhánh "Tiếp tục" ở Backend

**Mục tiêu:** Nhận diện lệnh `force: true` cho phép tiếp tục lưu dữ liệu vào Data sheet mà không cần kiểm tra lại lỗi trùng.

- [x] Task 3.1: Thêm logic bỏ qua vòng validation `duplicate_warning` và cho tiến trình `importToDatabase` đi thẳng tới `getRange(...).setValues(...)` khi cờ `force` là giá trị `true`.
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (Push code toàn bộ dự án lên qua `push-all.ps1` và test Upload E2E quy trình thật)

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-04-19 00:19 | Phase 1 | Task 1.1 | Bắt đầu thêm logic duplicate check | start | |
| 2026-04-19 00:23 | Phase 1-3 | All Tasks | Triển khai mã nguồn Backend & Frontend và Test Code Review | done | Mã nguồn tích hợp tốt do các Phase liên kết với nhau chặt chẽ |
| 2026-04-19 00:27 | Phase 3 | Task 3.Final | User phát hiện lỗi E2E không cảnh báo. Đã điều tra root cause rỗng cột | retry | Fix bug `indexOf` không nhận dạng tên cột "Mã hóa đơn" |
| 2026-04-19 00:38 | Phase 2 | Task 2.2 | Đổi thiết kế UX tải CSV sang Table | update | Hiển thị thẳng bảng trong hộp thoại `Swal` |
| 2026-04-19 00:43 | Phase 3 | Feature | Hoàn thiện UX & Test E2E thành công | done | User duyệt cả giao diện Bảng + Tính năng Tải CSV |
