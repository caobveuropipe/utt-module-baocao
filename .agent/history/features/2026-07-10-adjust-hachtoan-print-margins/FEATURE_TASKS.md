# Feature Tasks: Tối ưu lề và tăng kích thước chữ trang in Chức năng hạch toán

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-07-10

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Cấu hình lề in URL và cỡ chữ trong code cho 4 module hạch toán

**Mục tiêu:** Hoàn tất tinh chỉnh lề in và cỡ chữ trong code cho các file hạch toán.

- [x] Task 1.1: Tinh chỉnh lề in (`&left_margin=0.5&right_margin=0.25&top_margin=0.25&bottom_margin=0.25`) và cỡ chữ (dữ liệu 10.5, header 11, title 12), font Arial cho báo cáo Hạch toán bảo hiểm trong [doGet_hachToanBaoHiem.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_hachToanBaoHiem.js)
- [x] Task 1.2: Tinh chỉnh lề in (`&left_margin=0.5&right_margin=0.25&top_margin=0.25&bottom_margin=0.25`) và cỡ chữ (dữ liệu 10.5, header 11, title 12), font Arial cho báo cáo Hạch toán KPCĐ trong [doGet_hachToanKPCD.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_hachToanKPCD.js)
- [x] Task 1.3: Tinh chỉnh lề in (`&left_margin=0.5&right_margin=0.25&top_margin=0.25&bottom_margin=0.25`) và cỡ chữ (dữ liệu 10.5, header 11, title 12), font Arial cho báo cáo Hạch toán lương và truy lĩnh trong [doGet_hachToanLuongVaTruyLinh.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_hachToanLuongVaTruyLinh.js)
- [x] Task 1.4: Tinh chỉnh lề in (`&left_margin=0.5&right_margin=0.25&top_margin=0.25&bottom_margin=0.25`) và cỡ chữ (dữ liệu 10.5, header 11, title 12), font Arial cho báo cáo Phân bổ lương và BHXH trong [doGet_phanBoLuongBHXH.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_phanBoLuongBHXH.js)
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc)

## Phase 2: Deploy và Kiểm tra bản in thực tế

**Mục tiêu:** Deploy code qua clasp và xác thực giao diện các file PDF hạch toán.

- [x] Task 2.1: Chạy deploy-all.ps1 hoặc push-all.ps1 để cập nhật code lên Google Apps Script
- [x] Task 2.2: Xuất thử các báo cáo hạch toán và xác nhận giao diện in PDF có lề gọn hơn và chữ to hơn
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Bắt buộc)

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-07-10 09:55 | Phase 1 | Khởi tạo | Tạo tệp tin checklist | done | |
| 2026-07-10 09:55 | Phase 1 | Task 1.1 | Bắt đầu sửa doGet_hachToanBaoHiem.js | start | |
| 2026-07-10 09:56 | Phase 1 | Task 1.1 | Thêm setFontSize(11) + URL lề mới | done | |
| 2026-07-10 09:56 | Phase 1 | Task 1.2 | Thêm setFontSize(11) + URL lề mới doGet_hachToanKPCD.js | done | |
| 2026-07-10 09:56 | Phase 1 | Task 1.3 | Thêm setFontSize(11) + URL lề mới doGet_hachToanLuongVaTruyLinh.js | done | |
| 2026-07-10 09:56 | Phase 1 | Task 1.4 | Cập nhật URL lề mới doGet_phanBoLuongBHXH.js (setFontSize đã có sẵn) | done | |
| 2026-07-10 10:06 | Phase 1 | Tasks 1.1-1.4 | Đổi font chữ Times New Roman sang Arial theo yêu cầu | done | |
| 2026-07-10 10:14 | Phase 1 | Task 1.3 | Sửa lỗi viền bảng dư dòng 3 (điều chỉnh viền bắt đầu từ dòng 4 và data index thành idx + 6) | done | |
| 2026-07-10 10:22 | Phase 1 | Tasks 1.1-1.4 | Cập nhật cỡ chữ: Tiêu đề size 12, Header size 11, Body size 10.5 | done | |
| 2026-07-10 10:23 | Phase 1 | Task 1.3 | Giảm 15% chiều rộng cột Nội dung (Cột A) để nhường chỗ cho cột số liệu | done | |
| 2026-07-10 10:28 | Phase 1 | Tasks 1.1-1.3 | Sửa lỗi lệnh fullRange.setFontSize(10.5) ghi đè lên cỡ chữ tiêu đề và header | done | |
| 2026-07-10 10:55 | Phase 1 | Task 1.1 | Thêm sheet.setFrozenRows(6) để lặp lại tiêu đề cột (header) bảo hiểm trên trang 2 | done | |
| 2026-07-10 11:29 | Phase 1 | Task 1.4 | Điều chỉnh cỡ chữ dòng 9 (dòng header phụ) trong bảng Phân bổ lương & BHXH thành 10 | done | |
| 2026-07-10 11:35 | Phase 2 | Tasks 2.1-2.2 | Hoàn thành deploy, verify PDF hiển thị Arial sắc nét, lặp lại header bảo hiểm trang 2 thành công | done | |
| 2026-07-10 11:35 | Phase 2 | Handoff | Hoàn tất toàn bộ tính năng và bàn giao | done | |
| 2026-07-10 09:56 | Phase 1 | Task 1.Final | Bắt đầu self-test | start | |
