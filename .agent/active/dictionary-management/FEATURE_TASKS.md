# Feature Tasks: Quản Lý Danh Mục Mở Rộng (Dictionary Management)

> **Trạng thái**: 🔄 Đang thực hiện
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-04-19

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Read Contract và Capability Flags

**Mục tiêu:** Chốt read-path an toàn và thống nhất contract dữ liệu trả về cho UI.

- [x] Task 1.1: Thêm `action=getDictionaries` vào `doget/doGet.gs`.
- [x] Task 1.2: Trả về 2 list dictionary `DanhSachNhanVien`, `DanhMucSPDV` theo đúng header hiện tại của sheet.
- [x] Task 1.3: Trả về `capabilities.canManageDictionary` theo rule: `Admin` hoặc `Leader` có quyền `dictionary_mgr`.
- [x] Task 1.4: Đảm bảo read API không trả `HMAC_SECRET` dưới bất kỳ hình thức nào.
- [x] Task 1.5: (Bổ sung) Tạo script test mẫu (Test Protocol) để user verify kết quả Phase 1 qua URL Web App.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Test read path cho `Admin`, `Leader`, user thường; verify response không chứa secret).

## Phase 2: Backend Write Contract và Security Rule

**Mục tiêu:** Hoàn thiện write-path theo mô hình proxy write server-side và server-side authorization recheck.

- [x] Task 2.1: Thêm `getDictionaries()` và `saveDictionary(payload)` vào `client/Code.gs`.
- [x] Task 2.2: `saveDictionary(payload)` phải ký payload ở server-side bằng `HMAC_SECRET`, thêm `callerEmail`, `timestamp`, `nonce`, rồi proxy sang `dopost`.
- [x] Task 2.3: Thêm `action=updateDictionary` vào `dopost/doPost.gs`.
- [x] Task 2.4: Reuse `verifyMutationSignature`, `isFreshTimestamp`, `isReplayNonce` cho luồng ghi dictionary.
- [x] Task 2.5: Bổ sung rule phân quyền ghi mới theo đúng chuẩn: `Admin` hoặc `Leader` có quyền `dictionary_mgr`.
- [x] Task 2.6: Thêm audit log cho update dictionary với loại dictionary, số dòng ghi và người thực hiện.
- [x] Task 2.7: Validate toàn bộ payload xong mới được phép `clearContents()` và `setValues()`.
- [x] Task 2.8: Ghi dữ liệu theo mô hình `full-list replace`, chỉ xóa phần data rows và luôn giữ nguyên header row.
- [x] Task 2.9: (Bổ sung) Tạo script mô phỏng request ký lậu (Spoofing/Replay) để test độ cứng của `doPost`.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Unauthorized, bad signature, expired timestamp, replay nonce, payload sai schema).

## Phase 3: Allocation Compatibility và Fallback Theo Tên

**Mục tiêu:** Giữ tương thích ngược cho dữ liệu cũ mà không làm allocation crash hoặc match sai.

- [x] Task 3.1: Nâng cấp `loadServiceMap()` để có map theo `Mã SP` và map theo tên đã normalize.
- [x] Task 3.2: Nâng cấp `getServiceMetadata()` lookup theo mã trước, theo tên sau.
- [x] Task 3.3: Nếu fallback theo tên gặp trường hợp mơ hồ thì dùng hành vi an toàn, không chọn bừa một record.
- [x] Task 3.4: Rà soát logic lookup nhân sự để không tạo thêm ambiguity ngoài contract hiện tại.
- [ ] Task 3.Final: 🧪 Test & Verify Phase 3 (File Excel cũ không có mã vẫn chạy; case duplicate tên fallback được xử lý an toàn).

## Phase 4: UI Dictionary Management

**Mục tiêu:** Cung cấp giao diện quản lý đơn giản, dễ hiểu, bám đúng capability flag và local edit model.

- [x] Task 4.1: Tạo page hoặc section quản lý dictionary với 2 sub-tab `Nhân sự` và `Sản phẩm & Dịch vụ`.
- [x] Task 4.2: Render bảng danh mục rõ ràng, ưu tiên đơn giản và dễ bảo trì hơn DataTables nặng.
- [x] Task 4.3: Chỉ hiện add/edit/delete/save cho `canManageDictionary`.
- [x] Task 4.4: Dùng local edit model: thêm/sửa/xóa trong bộ nhớ; chỉ ghi thật khi bấm save.
- [x] Task 4.5: Thêm validate client-side cho field bắt buộc trước khi submit.
- [x] Task 4.6: Có cảnh báo unsaved changes và khả năng reload lại dữ liệu canonical sau save hoặc cancel.
- [x] Task 4.Final: 🧪 Test & Verify Phase 4 (Role gating, validate form, save success reload, cancel discard local changes).

## Phase 5: E2E Verify và Regression Test

**Mục tiêu:** Xác nhận toàn bộ luồng hoạt động ổn định từ UI tới backend và không phá behavior cũ.

- [ ] Task 5.1: E2E từ UI -> `client/Code.gs` -> `dopost` cho cả `staff` và `service`.
- [ ] Task 5.2: Concurrent save test để xác nhận `LockService` ngăn race-condition.
- [ ] Task 5.3: Role matrix test cho `Admin`, `Leader` có `dictionary_mgr`, `Leader` không có `dictionary_mgr`, user thường.
- [ ] Task 5.4: Regression test cho allocation với dữ liệu có mã và dữ liệu cũ không có mã.
- [ ] Task 5.Final: 🧪 Test & Verify Phase 5 (Chốt E2E, concurrency, security, allocation compatibility).

---

## Ngôn ngữ và wording bắt buộc

- [ ] Không dùng cụm “inject secret xuống frontend”.
- [ ] Không dùng cụm “CRUD sheet trực tiếp”.
- [ ] Dùng nhất quán các cụm:
  - `proxy write server-side`
  - `capability flag`
  - `full-list replace`
  - `server-side authorization recheck`
  - `fallback theo tên đã normalize`

---

## Giả định mặc định

- [ ] Giữ nguyên kiến trúc 3 project: `client`, `doget`, `dopost`.
- [ ] Không thay đổi header hiện tại của 2 sheet.
- [ ] Không làm soft delete ở v1.
- [ ] Không thêm import/export dictionary ở v1.
- [ ] Không expose secret ra browser.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-04-19 | 1 | 1.1-1.4 | Triển khai API đọc danh mục và capability flags | done | |
| 2026-04-19 | 1 | 1.Final | 🧪 Test & Verify Phase 1 | done | AI Self-test passed via mock runtime |
| 2026-04-19 | 2 | 2.1-2.9 | Triển khai Write Proxy, Security Verification và Write Logic | done | Security Stress Test passed (HMAC/Nonce/TTL/Schema validated) |
| 2026-04-19 | 2 | 2.Final | 🧪 Test & Verify Phase 2 | done | Logic verified via mock stress test |
| 2026-04-19 | 3 | 3.1-3.4 | Nâng cấp thuật toán Allocation hỗ trợ Fallback Mapping | done | Unit Test passed (ID priority, Name Fallback, Ambiguity protection) |
| 2026-04-19 | 3 | 3.Final | 🧪 Test & Verify Phase 3 | done | Verified with mock data matching and fallback regex |
| 2026-04-19 | 4 | 4.1-4.6 | Triển khai UI Dictionary Management (Tabs, Local Edit Model, Security) | done | UI polished with premium CSS and dirty-state handling |
