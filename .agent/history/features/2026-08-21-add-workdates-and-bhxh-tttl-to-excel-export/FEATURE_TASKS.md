# Feature Tasks: Bổ sung Ngày công tác & BHXH TTTL vào Tổng Hợp Lương Excel

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-08-21

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

---

## Phase 1: Mở rộng Logic Trích Xuất Dữ Liệu từ DataChotNSThang & DataTruyThuLinh

**Mục tiêu:** Parse chuỗi ngày công tác thành 3 trường riêng biệt và đọc thêm 4 khoản BHXH-TTTL từ nguồn `DataTruyThuLinh` L1.

- [x] Task 1.1: Viết hàm helper `parseWorkDates(dateStr)` hỗ trợ tách chuỗi `ngayBC|ngayNganh|ngayKTHD` an toàn (xử lý khoảng trắng, rỗng, null, giữ nguyên định dạng `yyyy-mm-dd`).
- [x] Task 1.2: Cập nhật hàm `requireColumns` và trích xuất cột `Ngày công tác` trong sheet `DataChotNSThang`, đưa 3 trường ngày vào `nsInfo` trong `baseMap`.
- [x] Task 1.3: Cập nhật hàm `processTTL` trong `doGet_tongHopExcel.js` để đọc thêm 4 cột `BHXH`, `BHYT`, `BHTN`, `KPCĐ` (hoặc `Đoàn phí`) từ sheet `DataTruyThuLinh` của Lương 1 và lưu vào đối tượng nhân sự trong `baseMap`.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Kiểm tra dữ liệu baseMap trích xuất đủ và chính xác cho các trường hợp mẫu).

---

## Phase 2: Cập Nhật Cấu Trúc Header 56 Cột và Xuất Excel

**Mục tiêu:** Cập nhật mảng headers, mapping mảng rows, đảm bảo file Excel xuất ra đầy đủ 56 cột và định dạng chuẩn.

- [x] Task 2.1: Cập nhật mảng `headers` trong `buildTongHopSalaryExcelData` để bổ sung:
  - `Ngày vào biên chế`, `Ngày vào ngành`, `Ngày kết thúc hợp đồng` (sau thông tin nhân sự / tài khoản).
  - `BHXH-TTTL`, `BHYT-TTTL`, `BHTN-TTTL`, `KPCĐ-TTTL` (bên cạnh `TTTL L1`).
- [x] Task 2.2: Cập nhật hàm ánh xạ `rows` trong `buildTongHopSalaryExcelData` để ghép đúng thứ tự 56 cột theo `headers`.
- [x] Task 2.3: Cập nhật comment mô tả module thành "bảng lương 56 cột từ 6 nguồn khác nhau".
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Chạy hàm build dữ liệu và kiểm tra `row.length === headers.length === 56`, kiểm tra file Excel tạo ra hợp lệ).

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-08-21 09:56 | - | Khởi tạo | Tạo FEATURE_PLAN.md và FEATURE_TASKS.md | done | Chờ User duyệt plan |
| 2026-08-21 10:00 | Phase 1 | Tasks 1.1-1.3, 1.Final | Parse ngày công tác & trích xuất 4 cột BH TTTL | done | AI self-test pass |
| 2026-08-21 10:01 | Phase 2 | Tasks 2.1-2.3, 2.Final | Mở rộng headers & rows sang 56 cột | done | AI self-test pass (56 cột) |

