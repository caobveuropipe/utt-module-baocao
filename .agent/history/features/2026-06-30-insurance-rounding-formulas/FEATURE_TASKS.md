# Feature Tasks: Bảng tổng hợp bảo hiểm - Làm tròn và dùng công thức SUBTOTAL

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-06-30

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Làm tròn giá trị bảo hiểm về hàng đơn vị trước khi tính tổng

**Mục tiêu:** Đảm bảo tất cả dữ liệu chi tiết đóng bảo hiểm của cá nhân (hoặc nhóm phụ như Luong, TruyThu, TruyLinh) được làm tròn trước khi ghi hay cộng dồn.

- [x] Task 1.1: Cập nhật hàm `doGet_tongHopBaoHiem` để làm tròn các giá trị của NLĐ (`BHXH`, `BHYT`, `BHTN`) và các giá trị của Nhà trường tương ứng.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1: Thực hiện log thử hoặc chạy dry-run để xác nhận các số liệu sau làm tròn khớp với mong đợi.

## Phase 2: Triển khai sinh công thức Excel thay thế số tĩnh

**Mục tiêu:** Tạo chuỗi công thức Excel (SUBTOTAL, ROUND, SUM) và ghi vào các cột/dòng tổng cộng của sheet THBH.

- [x] Task 2.1: Tính toán chính xác vị trí hàng (Row Index) động trong mảng dữ liệu output trước khi ghi vào Google Sheets.
- [x] Task 2.2: Thay đổi phần tử trong mảng dữ liệu trả về của `doGet_tongHopBaoHiem` thành chuỗi công thức Excel cho các ô:
  - Cột H (NLĐ Thành tiền): `=SUBTOTAL(9, E[row]:G[row])`
  - Cột I (BHXH Trường): `=ROUND(E[row] * 17.5 / 8, 0)`
  - Cột J (BHYT Trường): `=ROUND(F[row] * 3 / 1.5, 0)`
  - Cột K (BHTN Trường): `=ROUND(G[row] * 1 / 1, 0)`
  - Cột L (Trường Thành tiền): `=SUBTOTAL(9, I[row]:K[row])`
  - Cột M (Tổng cộng): `=H[row]+L[row]`
- [x] Task 2.3: Thay thế các dòng tổng nhóm (I, II, III, IV) và dòng Cộng cuối bảng 1 bằng công thức:
  - Dòng tổng nhóm: `=Luong - TruyLinh + TruyThu` tương ứng (Ví dụ: `=E8-E9+E10`)
  - Dòng Cộng: `=SUBTOTAL(9, E7, E11, E15, E19)` (Tổng các dòng nhóm)
- [x] Task 2.4: Thay thế phần tách mã (LA, HW) và dòng Cộng của phần tách mã bằng công thức tương tự. Đảm bảo ánh xạ đúng tên mã theo địa phương:
  - Phú Thọ: `Mã LA0001A (đi nước ngoài)` và `Mã HW0004A`
  - Hà Nội: `Mã LA0001N (đi nước ngoài)` và `Mã HW0013N`
  - Khác: `Mã LA... (đi nước ngoài)` và `Mã HW03889`
- [x] Task 2.Final: 🧪 Test & Verify Phase 2: Chạy `test_doGet_taoBangTongHopbaoHiem()` để ghi dữ liệu và công thức vào Google Sheet. Kiểm tra trực quan xem công thức được nhận diện chính xác trên Sheet.

## Phase 3: Kiểm tra sự tương thích và tự động tính toán lại của file Excel tải về

**Mục tiêu:** Kiểm tra và bàn giao tính năng.

- [x] Task 3.1: Xuất file Excel từ Google Sheet.
- [x] Task 3.2: Mở file Excel bằng phần mềm xem Excel (hoặc tải về kiểm tra), xác nhận khi thay đổi giá trị gốc ở cột E, F, G thì các cột tổng (H, L, M) và dòng tổng tự động thay đổi theo.
- [x] Task 3.Final: 🧪 Test & Verify Phase 3: Báo cáo kết quả và nhờ user xác nhận lần cuối.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-06-30 | Phase 1 | Khởi tạo | Tạo kế hoạch và danh sách task | done | |
| 2026-06-30 09:03 | Phase 1 | Task 1.1 | Bắt đầu làm tròn giá trị bảo hiểm về hàng đơn vị | start | |
| 2026-06-30 09:05 | Phase 1 | Task 1.1 | Hoàn thành làm tròn giá trị bảo hiểm trong loops và calculateRow | done | |
| 2026-06-30 09:05 | Phase 1 | Task 1.Final | Thực hiện tự kiểm thử Phase 1 | start | |
| 2026-06-30 09:07 | Phase 1 | Task 1.Final | Xác nhận của User: Số liệu đã được làm tròn thành công | done | |
| 2026-06-30 09:07 | Phase 2 | Task 2.1 | Bắt đầu thiết kế định vị hàng động và viết công thức Excel | start | |
| 2026-06-30 09:08 | Phase 2 | Task 2.1-2.4 | Hoàn thành viết các công thức dynamic row Excel (SUBTOTAL, ROUND, addition/subtraction) | done | |
| 2026-06-30 09:08 | Phase 2 | Task 2.Final | Bắt đầu tự kiểm thử Phase 2 | start | |
| 2026-06-30 09:15 | Phase 2 | Task 2.2-2.4 | Chuyển đổi công thức đại số thành hàm (SUM) và đổi dấu ngăn cách thành chấm phẩy (;) | done | |
| 2026-06-30 09:17 | Phase 2 | Task 2.2 | Chuyển đổi dấu thập phân của số thực trong công thức sang dấu phẩy (,) | done | |
| 2026-06-30 09:31 | Phase 2 | Task 2.Final | Xác nhận của User: Các công thức và cấu trúc logic đã chính xác | done | |
| 2026-06-30 09:31 | Phase 3 | Task 3.1 | Bắt đầu tải và xác minh file Excel | start | |
| 2026-06-30 09:32 | Phase 3 | Task 3.2-3.Final | Xác nhận của User: File Excel tải về tính toán lại tự động hoàn hảo | done | |
| 2026-06-30 09:32 | - | Kết thúc | Hoàn thành toàn bộ feature | done | |



