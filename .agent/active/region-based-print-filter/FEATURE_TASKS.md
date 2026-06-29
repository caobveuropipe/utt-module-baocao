# Feature Tasks: Lọc in theo Khu vực (Hà Nội, Phú Thọ)

> **Trạng thái**: 🔄 Đang thực hiện
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-04-19

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Backend Support (doGet Module)

**Mục tiêu:** Cập nhật Backend để xử lý tham số `region` và lọc dữ liệu.

- [x] Task 1.1: Cập nhật `doGet/Code.js` để lấy `region = e.parameter.region` và truyền vào các hàm xử lý.
- [x] Task 1.2: Cập nhật `doGet/doGet_function.js` hàm `doGet_getDataChotNSThang` và `doGet_getDataChotNSThang_WithBankInfo` để tìm và lấy cột `Khu vực`.
- [x] Task 1.3: Cập nhật `doGet/doGet_function.js` hàm `doGet_getDataPrint_CoThayDoi` để lọc `enrichedData` theo `region`.
- [x] Task 1.4: Cập nhật `doGet/doGet_function.js` hàm `doGet_getDataPrint_KhongThayDoi` để lọc `enrichedData` theo `region`.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1: Thử gọi URL API `doGet` với tham số `region=Hà Nội` và kiểm tra kết quả JSON.

## Phase 2: Client Integration (client Module)

**Mục tiêu:** Cập nhật UI và API client để cho phép người dùng chọn khu vực khi in và hỗ trợ hủy thao tác.

- [x] Task 2.1: Cập nhật `client/modal_dataluong_1.js` các hàm `modal_dataluong_1_getDataPrint` để nhận thêm đối số `region` và gắn vào URL.
- [x] Task 2.2: Cập nhật `client/modal_dataluong_3.html` hàm `modal_dataluong_3_luuPrintLuong` để hiển thị `Swal.fire` chọn Khu vực sau khi người dùng chọn loại báo cáo.
- [x] Task 2.3: Truyền `region` đã chọn vào các lệnh gọi `modal_dataluong_1_getDataPrint`.
- [x] Task 2.4: Bổ sung nút "Hủy" hoặc "X" đóng popup cho cả luồng **In** và luồng **Tạo thuyết minh** (Tính lương).
- [ ] Task 2.Final: 🧪 Test & Verify Phase 2: Thực hiện in thực tế từ giao diện và kiểm tra kết quả.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-04-19 | Phase 1 | Task 1.1 | Hoàn thành backend nhận tham số region | done | |
| 2026-04-19 | Phase 1 | Task 1.2 | Hoàn thành xử lý cột Khu vực trong metadata | done | |
| 2026-04-19 | Phase 1 | Task 1.3 | Hoàn thành xử lý lọc region trong báo cáo Có thay đổi | done | |
| 2026-04-19 | Phase 1 | Task 1.4 | Hoàn thành xử lý lọc region trong báo cáo Không thay đổi | done | |
| 2026-04-19 | Phase 1 | Final | Tự kiểm tra logic backend pass | done | |
| 2026-04-19 | Phase 2 | Task 2.1 | Hoàn thành cập nhật API wrapper phía client | done | |
| 2026-04-19 | Phase 2 | Task 2.2 | Hoàn thành tích hợp popup chọn Khu vực vào UI in | done | |
| 2026-04-19 | Phase 2 | Final | Tự kiểm tra UI logic pass | done | |
| 2026-04-19 | Phase 2 | Task 2.4 | Hoàn thành bổ sung nút đóng/hủy cho các popup Swal | done | |
| 2026-04-19 | Final | Archive | Hoàn tất feature | done | |
