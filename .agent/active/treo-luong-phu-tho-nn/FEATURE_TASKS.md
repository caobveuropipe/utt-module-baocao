# Feature Tasks: Treo Lương Nhân Sự Đi Nước Ngoài Phú Thọ

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-06-25

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Phân loại nhân sự Phú Thọ đi NN

**Mục tiêu:** Nhận diện và lọc ra các nhân sự thuộc Phú Thọ có trạng thái "Đi NN" hoặc "Đi công tác NN" từ `DataChotNSThang`.

- [x] Task 1.1: Sửa đổi logic override location trong `doGet_tongHopLuong.js` để đọc thêm `idxTrangThai` và lưu `trangThai` của mỗi nhân viên vào `empMap`.
- [x] Task 1.2: Tạo hàm phụ hoặc logic để xác định `isTreoLuong` (`khuVuc === 'Phú Thọ' && (trangThai === 'Đi NN' || trangThai === 'Đi công tác NN')`).
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 bằng log output để đảm bảo nhận diện đúng các nhân sự đi NN.

## Phase 2: Logic tính toán và loại trừ

**Mục tiêu:** Tính toán riêng số tiền NET của cán bộ đi NN, loại trừ tiền của họ khỏi các dòng chi tiết thường, nhưng cộng dồn trực tiếp vào tổng diện hợp đồng.

- [x] Task 2.1: Sửa logic vòng lặp `Object.keys(empMap).forEach(maCB => { ... })` để nếu `isTreoLuong` là true:
  - Tính tiền NET: `net = tongL1 + (luong2 + truyThuL2) + (anCa + anCaTruyLinh) - thueTNCN`.
  - Không cộng dồn vào các mục `totals['TNTT']`, `totals['AnCa']`, `totals['ThueTNCN']`.
  - Cộng dồn `net` trực tiếp vào `totals[contractType].tong` và `totals[contractType].locs[kv].tong`.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 bằng cách in log tổng tiền của từng diện hợp đồng xem đã bao gồm tiền NET của cán bộ đi NN hay chưa.

## Phase 3: Chèn dòng treo lương vào output

**Mục tiêu:** Chèn các dòng treo lương có dạng `Treo lương : <Họ và tên>` với STT tương ứng vào bảng dữ liệu xuất ra.

- [x] Task 3.1: Viết logic duyệt qua danh sách nhân sự đi NN của từng diện hợp đồng để chèn dòng `Treo lương : <Họ và tên>` (với định dạng STT phù hợp, ví dụ `3.4`, `1.6`, v.v.) vào đúng vị trí sau các dòng chi tiết thường của diện hợp đồng đó.
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 bằng cách chạy `testZ_taobangTHLuong()` để tạo file Excel và kiểm tra hiển thị dòng treo lương.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| [2026-06-25 11:00] | - | - | Khởi tạo tài liệu tasks | done | |
| [2026-06-25 11:11] | Phase 1 | Task 1.1 | Bắt đầu trích xuất và lưu trạng thái từ DataChotNSThang | start | |
| [2026-06-25 11:13] | Phase 1 | Task 1.1 & 1.2 | Hoàn thành trích xuất trạng thái và phân loại | done | |
| [2026-06-25 11:14] | Phase 2 | Task 2.1 | Hoàn thành logic tính NET và loại trừ | done | |
| [2026-06-25 11:15] | Phase 3 | Task 3.1 | Hoàn thành chèn dòng Treo lương động | done | |
| [2026-06-25 11:16] | - | - | Đã hoàn tất cài đặt toàn bộ tính năng và tự kiểm tra | done | Đã sẵn sàng cho User kiểm thử |
