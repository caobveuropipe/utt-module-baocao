---
source: expert-rebuttal-codex
feature: toi-uu-toc-do-va-ban-in
round: 4
timestamp: 2026-08-22T10:04:45+07:00
verdict: ✅ HỘI TỤ
---

# Expert Review - Codex Desktop

## Tóm tắt
- Findings mới nghiêm trọng: 0
- Findings đã dedupe/không lặp: 5 (toàn bộ findings P1 của hai vòng Codex trước đã được Antigravity accepted và cập nhật vào plan/tasks).
- Ngưỡng review cuối: Chỉ raise vấn đề có evidence trực tiếp và có thể gây lộ dữ liệu, bypass authorization, sai số liệu tài chính diện rộng, race condition giữa người dùng hoặc khiến mục tiêu in-memory không thể đạt.
- Vùng đã scan: `FEATURE_PLAN.md:28-47,79-144`, `FEATURE_TASKS.md:18-61`, `REBUTTAL_LOG.md:1-59`, `EXPERT_REVIEW.md` round 3, `doGet/Code.js:73-205`, `doGet/appsscript.json:20-30`, `doGet/doGet_function.js:1-63`, `client/pg_general_1.js:1-40,88-109,207-314`, `client/pg_general_3.html:400-430,552-625,686-814,1358-1421,1426-1479`, các `getPrintData*` và vùng xử lý số đã được map ở round 2/3.

## Findings Cần Antigravity Phản Biện
- Không có finding mới đạt ngưỡng nghiêm trọng.

## Không Raise Vì Thiếu Evidence / Đã Được Cover
- Fail-open token gate đã được cover bằng Task 1.2 và negative test tại `FEATURE_TASKS.md:23,25`.
- Permission bypass tại các RPC dữ liệu đã được cover bằng authorization wrapper và test từng RPC tại `FEATURE_TASKS.md:57,59`.
- Race condition và I/O file trung gian đã được cover cho cả 5 luồng Kho Bạc và 4 luồng Hạch Toán bằng các pure in-memory builders tại `FEATURE_TASKS.md:31-34,43-46`.
- Type/value mismatch của Sheets API đã được cover bằng `UNFORMATTED_VALUE`, normalize/padding và so sánh cả value lẫn `typeof` tại `FEATURE_TASKS.md:20-25`. Không thấy consumer ngày tháng dựa trên `Date#getTime`, `instanceof Date` hoặc phép toán Date trong các vùng báo cáo mục tiêu để chứng minh thêm một P1 về date conversion.
- XSS trong popup HTML đã được cover bằng helper output encoding áp dụng cho toàn bộ trường động và injection test tại `FEATURE_TASKS.md:35,37,47,49`.
- Không raise các điểm nhẹ về wording “8/9 bản in”, CSS in, cache TTL, breakpoint, benchmark methodology hoặc cách tổ chức helper vì không đạt ngưỡng ảnh hưởng nghiêm trọng của lượt cuối.

## Evidence âm tính
- Chuỗi bảo mật đã khép kín trong plan/tasks: session permission tại client RPC boundary → service token bắt buộc → Core API fail-closed trước route handler.
- Chuỗi dữ liệu đã khép kín: Sheets API unformatted values → normalize/padding → pure in-memory business builders → đối chiếu value/typeof và số liệu cũ → payload tối thiểu.
- Chuỗi render đã khép kín: dữ liệu in-memory → output encoding toàn bộ giá trị động → popup HTML → security test payload injection.
- Đường deploy chỉ xuất hiện sau Phase 4 security/E2E checks và có backup/rollback trong plan.

## Kết Luận
- ✅ HỘI TỤ trong phạm vi plan/tasks và các hotspot security, data integrity, API contract, concurrency, operations đã scan. Không còn finding nghiêm trọng có evidence cần phản biện trước khi triển khai.
- Có thể chuyển sang `feature-coordinator`.
