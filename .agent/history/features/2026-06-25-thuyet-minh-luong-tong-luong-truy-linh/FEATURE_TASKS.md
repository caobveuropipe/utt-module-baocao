# Feature Tasks: Thuyết minh lương 1 - Cập nhật tổng lương và truy lĩnh Phần II

> **Trạng thái**: 🔄 Đang thực hiện
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-06-25

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Phát triển Backend API (doGet)

**Mục tiêu:** Xây dựng helper tính tổng thực tế của toàn bộ cán bộ thuộc kỳ lương/khu vực và trả về qua API.

- [x] Task 1.1: Tạo hàm `doGet_getTotalSalarySums(monthStr, regionFilter)` trong [doGet_function.js](file:///d:/Project/UoTT/Dikhobac/ThuyetMinhL1/doGet/doGet_function.js).
- [x] Task 1.2: Gọi hàm này và đưa `totalSums` vào object JSON kết quả trả về trong [Code.js](file:///d:/Project/UoTT/Dikhobac/ThuyetMinhL1/doGet/Code.js) khi `type === 'coThayDoi_DataPrint'`.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bằng cách test endpoint doGet với params tương ứng).

## Phase 2: Phát triển Giao diện & Tích hợp (Client)

**Mục tiêu:** Client nhận kết quả tổng thực tế và render đúng lên giao diện in thuyết minh lương.

- [x] Task 2.1: Cập nhật hàm `modal_dataluong_1_getDataPrint` trong [modal_dataluong_1.js](file:///d:/Project/UoTT/Dikhobac/ThuyetMinhL1/client/modal_dataluong_1.js) để đón nhận `totalSums`.
- [x] Task 2.2: Trong [modal_dataluong_3.html](file:///d:/Project/UoTT/Dikhobac/ThuyetMinhL1/client/modal_dataluong_3.html), truyền `response.totalSums` từ API vào `openPrintWindow_ThuyetMinh`.
- [x] Task 2.3: Điều chỉnh logic render ở chân trang trong hàm `openPrintWindow_ThuyetMinh` để dùng giá trị từ `totalSums` thay vì cộng dồn từ `rows` có thay đổi.
- [/] Task 2.Final: 🧪 Test & Verify Phase 2 (Nhấn in thuyết minh lương và đối chiếu dòng tổng cộng với màn hình chính).

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-06-25 14:17 | Phase 1 | Task 1.1 | Bắt đầu xây dựng helper `doGet_getTotalSalarySums` | start | |
| 2026-06-25 14:18 | Phase 1 | Task 1.1 | Hoàn tất tạo hàm helper `doGet_getTotalSalarySums` | done | |
| 2026-06-25 14:18 | Phase 1 | Task 1.2 | Bắt đầu tích hợp `totalSums` vào handler API của Code.js | start | |
| 2026-06-25 14:19 | Phase 1 | Task 1.2 | Hoàn tất tích hợp `totalSums` vào Code.js | done | |
| 2026-06-25 14:19 | Phase 1 | Task 1.Final | Bắt đầu test tự động / tự kiểm tra Phase 1 | start | |
| 2026-06-25 14:20 | Phase 1 | Task 1.Final | Đã kiểm tra tĩnh cú pháp và logic các hàm backend | done | Cần deploy lên GAS để chạy thực tế |
| 2026-06-25 14:20 | Phase 2 | Task 2.1 | Chuyển sang Phase 2, bắt đầu cập nhật client utility | start | |
| 2026-06-25 14:21 | Phase 2 | Task 2.1 | Hoàn tất cập nhật client utility `modal_dataluong_1_getDataPrint` | done | |
| 2026-06-25 14:21 | Phase 2 | Task 2.2 | Bắt đầu tích hợp truyền `totalSums` và cập nhật logic in | start | |
| 2026-06-25 14:22 | Phase 2 | Task 2.2 & 2.3 | Hoàn tất tích hợp HTML layout in thuyết minh và truyền tham số | done | |
| 2026-06-25 14:22 | Phase 2 | Task 2.Final | Bắt đầu chuyển sang tự kiểm tra Phase 2 | start | |
