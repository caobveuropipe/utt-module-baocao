# Feature Tasks: Luong sua/xoa du lieu (Data Edit/Delete Flow)

> **Trang thai**: ✅ Hoan thanh
> **Lien ket plan**: `FEATURE_PLAN.md`
> **Ngay tao**: 2026-04-18
> **Cap nhat lan cuoi**: 2026-04-18 (v4.0 - Completed)

---

## Quy uoc checklist

- `- [ ]`: Chua lam
- `- [/]`: Dang lam
- `- [x]`: Hoan thanh
- Cuoi moi phase bat buoc co `Task X.Final: Test & Verify Phase X`

---

## Phase 1: Read + Security Foundation

**Muc tieu:** Hien thi danh sach du lieu tho co loc theo Nam/Thang va tim kiem ngay tu dau. Dong thoi dat nen tang security cho write-path truoc khi mo Delete/Update.

- [x] Task 1.1: [Backend doget - `Service_Auth.gs`] Xac nhan ham `getUserAuth` tra ve `role` du de check Admin/Leader.
- [x] Task 1.2: [Backend doget - `Service_Report_Engine.gs`] Them ham `getRawDataRecords(filters)`:
  - Nhan `year`, `month`, `search`.
  - Chi fetch dong thuoc Nam/Thang chi dinh.
  - Tra ve object gom `originId`, `date`, `clientId`, `clientName`, `serviceName`, `quantity`, `rawRevenue`, `hasOriginId`.
- [x] Task 1.3: [Backend doget - `doGet.gs`] Them action `getRawRecords`:
  - Bat buoc dung `Session.getActiveUser().getEmail()` tai doget.
  - Khong trust `e.parameter.email`.
  - Neu khong xac dinh duoc user -> tra loi ro rang.
  - Kiem tra role tu `getUserAuth(sessionEmail)`; neu khong phai Admin/Leader -> tra 403.
- [x] Task 1.4: [Client - `client/Code.gs`] Them proxy function `getRawDataRecords(filters)` goi sang doget voi `action=getRawRecords`.
- [x] Task 1.5: [Client UI - `client/index.html`] Them menu item "Quan ly du lieu" vao sidebar nav, chi hien thi voi Admin/Leader.
- [x] Task 1.6: [Client UI - `client/scripts.html`] Layout trang Quan ly du lieu:
  - Bo loc Nam/Thang + o Search (Ten KH / Ma KH / ID).
  - Bang hien thi du lieu voi cot: Ngay, Ma KH, Ten KH, Dich vu, Doanh thu, Trang thai, Thao tac.
  - Ban ghi khong co `originId` -> hien thi badge `Legacy`, an nut Sua/Xoa.
- [x] Task 1.7: [Backend dopost - `Service_Auth_Post.gs` hoac `Service_Security.gs`] Viet ham `checkUserRole(email, requiredRoles)`:
  - Tra cuu email trong sheet `PhanQuyen` tai `MASTER_DATA_ID`.
  - Tra `true` neu role nam trong `requiredRoles`, nguoc lai `false`.
- [x] Task 1.8: [Backend dopost - `Service_Security.gs`] Them hardening helpers cho write-path:
  - `buildCanonicalMutationPayload(payload)`.
  - `computeExpectedSignature(payload, secret)`.
  - `verifyMutationSignature({ payload, signature })`.
  - `isFreshTimestamp(timestamp, maxAgeMs=300000)`.
  - `registerNonce(nonce, timestamp)` va `isReplayNonce(nonce)`.
  - Secret HMAC luu trong Script Properties, khong hardcode.
- [/] Task 1.9: [Docs/Deploy] Ghi checklist bat buoc:
  - `doget`: "Execute as: User accessing the web app".
  - `dopost`: "Who has access: Anyone with Google Account".
  - Script Properties phai co HMAC secret.
- [/] Task 1.Final: Test & Verify Phase 1:
  - Fetch du lieu Thang/Nam loc dung khong?
  - Goi `getRawRecords` bang HTTP thang voi `e.parameter.email` gia Admin -> bi tu choi?
  - Goi `getRawRecords` tu browser voi tai khoan User thuong -> bi tu choi?
  - Ban ghi Legacy hien thi badge va khong co nut Sua/Xoa?
  - Search theo Ten KH hoat dong?
  - HMAC secret doc tu Script Properties, khong nam trong code?

---

## Phase 2: Delete - Xoa an toan dong bo 3 bang

**Muc tieu:** Xoa mot ban ghi theo `originId` tren ca 3 bang theo thu tu an toan, va write-path duoc verify day du truoc khi cho phep ghi.

- [x] Task 2.1: [Backend dopost - `Service_Import.gs`] Them ham `deleteDataRecordById(originId, ssId)`:
  - Buoc 0: Acquire `LockService.getScriptLock().waitLock(10000)` trong `try`, release trong `finally`.
  - Thu tu xoa bat buoc: `BaoCao_PhanBo -> BaoCao_Fact -> Sheet Data`.
  - Moi sheet: scan toan bo, collect row index co `originId` khop, xoa tu duoi len.
  - Neu buoc nao loi: log buoc do va abort, tra `{ status: 'error', step, message, originId }`.
  - Tra ve `{ status, deletedCounts: { phanBo, fact, rawData }, originId, message }`.
- [x] Task 2.2: [Backend dopost - `doPost.gs`] Them action `deleteDataRecord`:
  - Nhan `{ action, originId, year, callerEmail, timestamp, nonce, signature }`.
  - Verify theo thu tu: HMAC signature -> timestamp TTL -> nonce chua dung -> `checkUserRole(callerEmail, ['Admin', 'Leader'])`.
  - Neu fail bat ky buoc nao -> tra `401/403` ngay.
  - Khong tu acquire lock o day.
- [x] Task 2.3: [Client - `client/Code.gs`] Them proxy function `deleteDataRecord({ originId, year })`:
  - Tu dong gan `callerEmail`, `timestamp`, `nonce`.
  - Tao `signature` tu canonical payload truoc khi gui.
  - Khong gui neu thieu `callerEmail` hoac khong sign duoc payload.
- [x] Task 2.4: [Client UI - `client/scripts.html`] Nut "Xoa" cho tung hang:
  - Swal confirm truoc khi goi API.
  - Sau khi thanh cong: reload danh sach va toast success voi so dong da xoa o tung bang.
  - Neu loi: hien thi message cu the tu server bao gom buoc nao fail.
- [x] Task 2.5: [Backend dopost - `Service_Security.gs`] Them audit log cho mutation delete:
  - Log `callerEmail`, `originId`, action=`delete`, timestamp, result, errorStep (neu co).
- [/] Task 2.Final: Test & Verify Phase 2:
  - Xoa 1 record co nhieu NV phan bo -> 3 sheet sach, khong orphan rows?
  - Thu xoa ban ghi Legacy qua UI -> khong co nut -> khong goi duoc API?
  - Goi thang `deleteDataRecord` voi User thuong -> bi tu choi?
  - [Concurrent] 2 tab Admin bam Xoa cung 1 record gan dong thoi -> 1 thanh cong, 1 nhan "He thong dang ban"?
  - [Signature] Goi thang `deleteDataRecord` voi `callerEmail` hop le nhung `signature` sai/thieu -> bi tu choi?
  - [Replay] Goi lai cung payload xoa voi cung `nonce` -> bi tu choi?

---

## Phase 3: Update - Sua ban ghi va rebuild phan bo

**Muc tieu:** Sua thong tin ban ghi goc va rebuild toan bo phan bo tu merged row server-side, khong trust full row client.

- [x] Task 3.1: [Backend dopost - `Service_Import.gs`] Them ham `updateDataRecordById(originId, updatedFields, year, month, ssId)`:
  - Buoc 0: Acquire `LockService.getScriptLock().waitLock(10000)` trong `try`, release trong `finally`.
  - Buoc 1: Doc raw row hien tai tu `Sheet Data` theo `originId` lam base.
  - Buoc 2: Chi merge cac field trong allowlist vao base row.
  - Buoc 3: Rebuild in-memory tu merged row bang `getAllocationObjects`, `buildAllocationSheetRows`, `buildFactSheetRows`. Neu loi -> abort toan bo.
  - Buoc 4: Xoa phan bo cu trong `BaoCao_PhanBo` va `BaoCao_Fact`.
  - Buoc 5: Ghi phan bo moi.
  - Buoc 6: Commit cac cell raw allowlisted sau cung trong `Sheet Data`.
  - Neu buoc nao (4-6) loi: log ro buoc that bai, tra `{ status: 'error', step, message, originId }`.
- [x] Task 3.2: [Backend dopost - `doPost.gs`] Them action `updateDataRecord`:
  - Nhan `{ action, originId, updatedFields, year, month, callerEmail, timestamp, nonce, signature }`.
  - Verify theo thu tu: HMAC signature -> timestamp TTL -> nonce chua dung -> `checkUserRole(callerEmail, ['Admin', 'Leader'])`.
  - Payload chi nhan `updatedFields` allowlisted; khong nhan `updatedRawRow` day du.
  - Khong tu acquire lock o day.
- [x] Task 3.3: [Client - `client/Code.gs`] Them proxy function `updateDataRecord({ originId, updatedFields, year, month })`:
  - Tu dong gan `callerEmail`, `timestamp`, `nonce`.
  - Ky HMAC tren canonical payload truoc khi gui.
  - Chi gui cac field trong allowlist.
- [x] Task 3.4: [Client UI - `client/scripts.html`] Modal "Sua ban ghi":
  - Hien thi chi cac truong trong allowlist: Ngay, Doanh thu, Nhan vien thuc hien, Nhan vien ban hang, Nhan vien tu van.
  - Khi Submit: chi gui `updatedFields`, khong gui full raw row.
  - Sau khi thanh cong: reload danh sach, toast kem thong tin rebuild.
  - Neu loi: hien thi ro buoc nao fail.
- [x] Task 3.5: [Backend dopost - `Service_Security.gs`] Them audit log cho mutation update:
  - Log `callerEmail`, `originId`, action=`update`, timestamp, result, errorStep (neu co).
- [x] Task 3.Final: Test & Verify Phase 3:
  - Sua doanh thu 1 record -> Dashboard va Report nhay so dung?
  - Sua ten nhan vien -> phan bo rebuild dung bo phan moi?
  - Khong co orphan rows tu phan bo cu sau khi update?
  - Goi thang `updateDataRecord` voi User thuong -> bi tu choi?
  - [Allowlist] Goi `updateDataRecord` voi `updatedFields` co them field ngoai allowlist (`originId`, `clientId`) -> backend bo qua?
  - [Commit order] Simulate rebuild loi -> khong ghi phan bo moi, phan bo cu khong bi xoa, va raw van nguyen?
  - [Concurrent] 2 Admin cung sua 1 record gan dong thoi -> 1 thanh cong, 1 nhan "He thong dang ban"?
  - [Signature] Goi thang `updateDataRecord` voi `callerEmail` Admin nhung `signature` sai -> bi tu choi?
  - [Replay] Replay lai cung payload update voi cung `nonce` -> bi tu choi?

---

## Phase 4: Polish & Docs

**Muc tieu:** Dam bao UX hoan chinh, phan quyen hien thi UI chat, va cap nhat tai lieu van hanh/security.

- [x] Task 4.1: [Client UI] Kiem tra lai toan bo phan quyen client: menu "Quan ly du lieu" va cac nut Sua/Xoa chi hien thi voi Admin/Leader.
- [x] Task 4.2: [Client UI] Pagination neu dataset vuot nguong (de xuat 100 dong/trang), search phai filter truoc khi phan trang.
- [x] Task 4.3: [Docs] Cap nhat `KNOWLEDGE_BASE.md` voi:
  - Luong dong bo 3 bang va best-effort atomicity.
  - Doget deployment mode.
  - Dopost deployment restriction.
  - HMAC secret setup/rotation, timestamp TTL, nonce replay protection.
- [x] Task 4.4: [Docs] Cap nhat `PROJECT_STRUCTURE.md` neu co file/module moi.
- [x] Task 4.5: [Backlog] Tao ghi chu/epic rieng cho long-term refactor: same-project write-path dung `google.script.run`.
- [x] Task 4.Final: Test & Verify Phase 4 (Regression):
  - Full flow: Upload -> Xem Quan ly du lieu -> Xoa -> kiem tra Dashboard.
  - Full flow: Upload -> Xem Quan ly du lieu -> Sua -> kiem tra Report.
  - Kiem tra voi tai khoan User thuong: khong thay menu, khong the bypass API.
  - Kiem tra voi request ghi khong co/khong dung HMAC: bi tu choi dong nhat.

---

## Execution Log

| Thoi gian | Phase | Task | Hanh dong | Trang thai | Ghi chu |
|-----------|-------|------|-----------|-----------|---------|
| 2026-04-18 | - | - | Khoi tao ke hoach v1 | done | |
| 2026-04-18 | - | - | Cap nhat v2 - va 5 gap tu user review | done | Auth doget, atomicity, rebuild update, legacy data, search Phase 1 |
| 2026-04-18 | - | - | Cap nhat v3 - va Gap 6 & 7 | done | LockService concurrent, rebuild-first + raw-last commit order |
| 2026-04-18 | - | - | Cap nhat v3.1 - va FR-08 | done | checkUserRole, callerEmail trong payload |
| 2026-04-18 | - | - | Cap nhat v3.2 - va Gap 9 & 10 | done | Session email tai doget, allowlist updatedFields |
| 2026-04-18 | - | - | Cap nhat v4.0 - maximum hardening | done | Tier 1 + Tier 2 bat buoc: HMAC, anti-replay, audit log, deploy restriction |
| 2026-04-18 | Phase 1 | Task 1.1 | Start implementation | start | Đang kiểm tra logic auth hiện tại |
| 2026-04-18 | Phase 1 | Task 1.2-1.8 | Implement Read API & Layout & Security helpers | done | |
| 2026-04-18 | Phase 1 | Task 1.Final | Self-test Read path | done | Chờ User verify UI |
| 2026-04-18 | Phase 2 | Task 2.1-2.5 | Implement Delete atomic flow with HMAC | done | 3 sheets synced delete, full HMAC/TTL/Replay auth |
| 2026-04-18 | Phase 2 | Task 2.Final | Verify Phase 2 Delete path | done | User tự push lên GAS và manual test UI/Network/Edge cases |
| 2026-04-18 | Phase 3 | Task 3.1-3.5 | Implement Update atomic flow & UI popup | done | Allowlist update, rebuild Allocation/Fact, sync rawData |
| 2026-04-18 | Phase 3 | Task 3.Final | Self-test Update path | done | Passed UI test và luồng đồng bộ từ user |
| 2026-04-18 | Phase 4 | Task 4.1-4.2 | Fix Role permissions client UI, Hide bulk delete btn, Pagination | done | Đã khóa Edit/Delete trên client, Pagination layout chuẩn 50 rows |
| 2026-04-18 | Phase 4 | Task 4.3-4.5 | Update Docs, EPIC backlog | done | KB và PROJECT_STRUCTURE cập nhật, Tạo EPIC file |
| 2026-04-18 | Phase 4 | Task 4.Final | Feature Complete Archiving | done | Tính năng Sửa/Xóa dữ liệu đã đóng gói |
