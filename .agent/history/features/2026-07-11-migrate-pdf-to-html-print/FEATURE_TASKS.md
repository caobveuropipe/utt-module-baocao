# Feature Tasks: Di chuyển xuất báo cáo PDF sang Form in HTML (HTML Print)

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-07-10

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Xây dựng Backend & API (GAS)

**Mục tiêu:** Cung cấp đầy đủ các JSON API từ Apps Script server để client-side có thể fetch dữ liệu thô phục vụ in ấn.

- [x] Task 1.1: Trích xuất logic sinh dữ liệu thô và viết hàm `getPrintDataTongHopBaoHiem(monthStr, location)` trong `doGet_tongHopBaoHiem.js`.
- [x] Task 1.2: Trích xuất logic sinh dữ liệu thô và viết hàm `getPrintDataTongHopKhoanTru(monthStr, location)` trong `doGet_tongHopKhoanTru.js`.
- [x] Task 1.3: Trích xuất logic sinh dữ liệu thô và viết hàm `getPrintDataTongHopKPCD(monthStr, location)` trong `doGet_tongHopKPCD.js`.
- [x] Task 1.4: Trích xuất logic sinh dữ liệu thô và viết hàm `getPrintDataHachToanBaoHiem(monthStr, location)` trong `doGet_hachToanBaoHiem.js`.
- [x] Task 1.5: Trích xuất logic sinh dữ liệu thô và viết hàm `getPrintDataHachToanKPCD(monthStr, location)` trong `doGet_hachToanKPCD.js`.
- [x] Task 1.6: Trích xuất logic sinh dữ liệu thô và viết hàm `getPrintDataPhanBoLuongBHXH(monthStr, location)` trong `doGet_phanBoLuongBHXH.js`.
- [x] Task 1.7: Trích xuất logic sinh dữ liệu thô và viết hàm `getPrintDataHachToanLuongVaTruyLinh(monthStr, location)` trong `doGet_hachToanLuongVaTruyLinh.js`.
- [x] Task 1.8: Đăng ký tất cả 7 route JSON mới vào `ROUTE_MAP` và whitelist `locationEnabledReports` trong `doGet/Code.js`. <!-- Sửa theo EFR-01: Để không mất tham số location -->
- [x] Task 1.9: Thêm các hàm call API client-side tương ứng trong `client/pg_general_1.js` (bao gồm sửa `pg1_ed1_getPrintDataTongHopLuong` nhận thêm location). <!-- Sửa theo EFR-02: Truyền location cho tổng hợp lương -->
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bảo đảm các API trả về đúng dữ liệu JSON cần thiết khi gọi từ client).

## Phase 2: Thiết kế giao diện HTML Print & CSS in ấn cho nhóm Tổng hợp

**Mục tiêu:** Căn lề trái tên trường + gạch chân căn giữa trong CSS, xây dựng và kết xuất giao diện in HTML cho 4 báo cáo tổng hợp.

- [x] Task 2.0: Cập nhật hộp thoại Swal trong `client/pg_general_4.html` của các báo cáo để hỗ trợ đủ 3 nút lựa chọn ("Xuất PDF", "Xuất Excel", "In báo cáo (HTML)").
- [x] Task 2.1: Cập nhật CSS in ấn trong `client/pg_general_3.html` để chuẩn hóa:
  - Khối trường học đặt góc trái trên cùng.
  - Tên trường gạch chân ≈ 50% độ rộng và căn giữa nếu không có cơ sở.
  - Cơ sở xuống dòng dưới, gạch chân toàn bộ cơ sở và tên trường không gạch chân.
- [x] Task 2.2: Sửa đổi sự kiện in ấn của Bảng tổng hợp lương để gọi `printBangTongHopLuong(location)` trong `client/pg_general_4.html` và chỉnh sửa hàm `generateLuongHtml` trong `client/pg_general_3.html` cho khớp CSS mới. Cần mở `window.open` trước khi gọi async để tránh popup blocker. <!-- Sửa theo EFR-02, EFR-03: Nhận location và sửa popup blocker -->
- [x] Task 2.3: Viết hàm sinh HTML `generateTongHopBaoHiemHtml(res, location)` và gắn nút In trong Bảng tổng hợp bảo hiểm.
- [x] Task 2.4: Viết hàm sinh HTML `generateTongHopKhoanTruHtml(res, location)` và gắn nút In trong Bảng tổng hợp các khoản trừ.
- [x] Task 2.5: Viết hàm sinh HTML `generateTongHopKPCDHtml(res, location)` và gắn nút In trong Bảng tổng hợp KPCĐ.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Đảm bảo 4 báo cáo tổng hợp in ấn hiển thị đúng layout, căn lề trái khối tên trường + gạch chân chuẩn).

## Phase 3: Hoàn thiện các báo cáo Hạch toán & Phân bổ

**Mục tiêu:** Xây dựng giao diện in HTML cho 4 báo cáo hạch toán/phân bổ và tích hợp toàn diện.

- [x] Task 3.1: Viết hàm sinh HTML và gắn nút in cho Bảng hạch toán bảo hiểm.
- [x] Task 3.2: Viết hàm sinh HTML và gắn nút in cho Bảng hạch toán KPCĐ.
- [x] Task 3.3: Viết hàm sinh HTML và gắn nút in cho Bảng phân bổ tiền lương và BHXH.
- [x] Task 3.4: Viết hàm sinh HTML và gắn nút in cho Bảng hạch toán lương và truy lĩnh.
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (Đảm bảo 4 báo cáo hạch toán/phân bổ hiển thị đúng layout in ấn HTML trên trình duyệt, đối chiếu tính nhất quán).

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
| 2026-07-10 14:56 | Phase 1 | Task 1.1 | Bắt đầu viết getPrintDataTongHopBaoHiem | start | |
| 2026-07-10 14:57 | Phase 1 | Task 1.1 | Hoàn thành viết getPrintDataTongHopBaoHiem | done | |
| 2026-07-10 14:57 | Phase 1 | Task 1.2 | Bắt đầu viết getPrintDataTongHopKhoanTru | start | |
| 2026-07-10 14:58 | Phase 1 | Task 1.2 | Hoàn thành viết getPrintDataTongHopKhoanTru | done | |
| 2026-07-10 14:58 | Phase 1 | Task 1.3 | Bắt đầu viết getPrintDataTongHopKPCD | start | |
| 2026-07-10 14:59 | Phase 1 | Task 1.3 | Hoàn thành viết getPrintDataTongHopKPCD | done | |
| 2026-07-10 14:59 | Phase 1 | Task 1.4 | Bắt đầu viết getPrintDataHachToanBaoHiem | start | |
| 2026-07-10 15:00 | Phase 1 | Task 1.4 | Hoàn thành viết getPrintDataHachToanBaoHiem | done | |
| 2026-07-10 15:00 | Phase 1 | Task 1.5 | Bắt đầu viết getPrintDataHachToanKPCD | start | |
| 2026-07-10 15:01 | Phase 1 | Task 1.5 | Hoàn thành viết getPrintDataHachToanKPCD | done | |
| 2026-07-10 15:01 | Phase 1 | Task 1.6 | Bắt đầu viết getPrintDataPhanBoLuongBHXH | start | |
| 2026-07-10 15:02 | Phase 1 | Task 1.6 | Hoàn thành viết getPrintDataPhanBoLuongBHXH | done | |
| 2026-07-10 15:02 | Phase 1 | Task 1.7 | Bắt đầu viết getPrintDataHachToanLuongVaTruyLinh | start | |
| 2026-07-10 15:03 | Phase 1 | Task 1.7 | Hoàn thành viết getPrintDataHachToanLuongVaTruyLinh | done | |
| 2026-07-10 15:03 | Phase 1 | Task 1.8 | Bắt đầu đăng ký các route mới trong Code.js | start | |
| 2026-07-10 15:04 | Phase 1 | Task 1.8 | Hoàn thành đăng ký các route mới trong Code.js | done | |
| 2026-07-10 15:04 | Phase 1 | Task 1.9 | Bắt đầu viết các hàm client-side trong pg_general_1.js | start | |
| 2026-07-10 15:05 | Phase 1 | Task 1.9 | Hoàn thành viết các hàm client-side trong pg_general_1.js | done | |
| 2026-07-10 15:05 | Phase 1 | Task 1.Final | Bắt đầu kiểm thử Phase 1 | start | |
| 2026-07-10 15:06 | Phase 1 | Task 1.Final | Chạy test_HTMLPrintEndpoints thành công cả 7 API | done | |
| 2026-07-10 15:07 | Phase 2 | Task 2.0 | Bắt đầu cập nhật các nút chọn in Swal trong pg_general_4.html | start | |
| 2026-07-10 15:08 | Phase 2 | Task 2.0 | Hoàn tất cập nhật các nút chọn in Swal trong pg_general_4.html | done | |
| 2026-07-10 15:08 | Phase 2 | Task 2.1 | Bắt đầu cập nhật CSS in ấn trong pg_general_3.html | start | |
| 2026-07-10 15:10 | Phase 2 & 3 | Tasks 2.2-3.4 | Cập nhật hoàn tất các hàm in ấn và template HTML | done | |
| 2026-07-10 15:10 | Phase 2 & 3 | Task 2.Final & 3.Final | Bắt đầu kiểm thử đồng bộ 8 báo cáo in ấn HTML | start | |
| 2026-07-11 22:15 | Phase 2 & 3 | Task 2.Final & 3.Final | Hoàn tất kiểm thử thủ công và tối ưu hóa giao diện bởi User | done | |
