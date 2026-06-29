# Feature Plan: Luong sua/xoa du lieu (Data Edit/Delete Flow)

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Plan v4.0 đã được duyệt qua hội đồng review. Sẵn sàng triển khai.
> **Feature slug**: data-edit-delete-flow
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-04-18
> **Cập nhật lần cuối**: 2026-04-18 (v4.0 — Maximum hardening bắt buộc)

---

## 1. Boi canh va muc tieu

- **Boi canh:** Hien tai he thong chi ho tro upload du lieu Excel moi. Neu co sai sot trong du lieu da ghi, nguoi dung phai xoa tay trong Spreadsheet hoac upload de, co rui ro xoa nham dai ngay.
- **Van de can giai quyet:** Thieu giao dien va API de quan ly, sua doi hoac xoa tung ban ghi du lieu cu the sau khi da import.
- **Muc tieu:** Cung cap mot trang "Quan ly du lieu" cho phep Admin/Leader tim kiem, chinh sua va xoa cac giao dich goc, dong thoi tu dong cap nhat lai cac bang bao cao phan bo lien quan.
- **Ket qua mong doi:** Feature du an toan de deploy noi bo trong trust boundary hien tai: du lieu dong bo tren ca 3 bang `Sheet Data`, `BaoCao_PhanBo`, `BaoCao_Fact`, va write-path duoc harden bang deployment restriction + HMAC signing + anti-replay + audit log.

## 2. Pham vi

### In scope
- Trang UI moi "Quan ly du lieu" (Data Management), co tim kiem va phan trang tu dau.
- Chuc nang tim kiem/loc du lieu tho tu `Sheet Data` (bat buoc co bo loc Nam/Thang de tranh fetch qua tai).
- Chuc nang xoa ban ghi theo `originId` (xoa dong bo 3 bang, best-effort atomicity).
- Chuc nang sua ban ghi: rebuild toan bo tu raw row da sua va goi lai engine phan bo de tranh lech cau truc.
- Hien thi ro rang va xu ly graceful doi voi cac ban ghi cu khong co `originId` (khong cho Sua/Xoa, hien thi badge `Legacy`).
- Hardening write-path cho `dopost`: deployment restriction, HMAC signature, timestamp/nonce kiem tra replay, audit log.

### Out of scope
- Sua doi cau truc cot cua Spreadsheet.
- Full audit log query/reporting UI. Feature nay chi yeu cau ghi log backend cho mutation.
- Dam bao atomicity cung (distributed transaction). GAS khong ho tro.
- Same-project refactor de dung `google.script.run` thay `UrlFetchApp` cho write-path.

## 3. Doi chieu Knowledge Base

- **Quyet dinh ke thua:**
  - Su dung `originId` lam khoa chinh duy nhat de lien ket du lieu tho va du lieu phan bo.
  - Duy tri va tai su dung engine phan bo hien co (`getAllocationObjects`, `buildAllocationSheetRows`, `buildFactSheetRows`), khong viet lai logic phan bo.
- **Cam ky can tranh:** Khong duoc lam mat tinh duy nhat cua `originId`. Khong duoc trust index tu client; phai luon tra cuu row bang scan theo `originId`.
- **Rang buoc kien truc:** Phai tuan thu mo hinh 3-project (Client, Doget, Dopost) va giao tiep qua proxy `UrlFetchApp`.

## 4. Gia dinh va cau hoi mo

### Gia dinh
- Du lieu cu khong co `originId` se hien thi voi badge `Legacy`, khong cho phep Sua/Xoa qua UI cho den khi duoc gan ID.
- Quyen doc danh sach giao dich goc la quyen nhay cam, chi danh cho Admin va Leader, kiem soat o ca UI lan `doget`.
- Quyen Sua/Xoa chi danh cho Admin va Leader, kiem soat o `dopost` sau khi da verify security envelope.
- Do kien truc 3-project, `Session.getActiveUser()` tai `dopost` tra ve script owner, khong phai end-user. Vi vay write-path phai dung `callerEmail` + HMAC signature + timestamp + nonce.
- **Gap 11 — Write-path security (v4.0, bắt buộc toàn bộ):** `callerEmail` từ payload là spoofable. Giải pháp trong scope hiện tại:
  - **Tier 1 (bắt buộc):** Restrict dopost "Who has access: Anyone with Google Account". Log `callerEmail` + `originId` + `action` + `timestamp` + `result` vào mọi mutation.
  - **Tier 2 (bắt buộc):** HMAC signing trên canonical payload (`email + timestamp + nonce + originId + action`). Anti-replay bằng `nonce` + `timestamp TTL` (mặc định 5 phút). Secret HMAC lưu trong Script Properties, không hardcode.
  - **Xử lý tại dopost:** verify signature → check timestamp TTL → check nonce chưa dùng → check role → thực thi. Fail bất kỳ bước → trả lỗi, không xử lý tiếp.
  - **Long-term fix (backlog riêng, Task 4.5):** Same-project refactor dùng `google.script.run` — khi đó `Session.getActiveUser()` là nguồn định danh hoàn toàn tin cậy, loại bỏ nối đa project ở write-path.
- **Residual risk con lai sau hardening:** Giam dang ke spoofing trong trust boundary hien tai, nhung chua tuong duong xac thuc danh tinh server-native. Long-term fix van la same-project refactor dung `google.script.run`.
- **Deployment mode (read-path):** Endpoint `getRawRecords` tai `doget` phai deploy voi "Execute as: User accessing the web app" de `Session.getActiveUser().getEmail()` tra ve email that. Khong duoc dung `e.parameter.email` tu URL lam nguon dinh danh.
- **Allowlist field:** Backend `updateDataRecordById` khong duoc tin toan bo raw row tu client. Chi merge cac field trong allowlist vao row hien tai doc tu `Sheet Data`. Cac field cot loi nhu `originId`, `clientId`, `serviceCode` khong bao gio duoc de tu payload.
- **Best-effort atomicity:** Xoa theo thu tu `BaoCao_PhanBo -> BaoCao_Fact -> Sheet Data`. Update theo thu tu `Rebuild in-memory -> Xoa phan bo cu -> Ghi phan bo moi -> Commit raw sau cung`.
- **Concurrent access:** Kiem soat bang `LockService.getScriptLock().waitLock(10000)` tren moi handler ghi. Neu khong acquire duoc lock thi tra loi ro rang va khong tiep tuc ghi.

### Cau hoi mo
- [Non-blocking] Co can ho tro "Xoa hang loat" (Bulk Delete) theo checkbox khong? Tam thoi chi lam tung dong de an toan.

## 5. Acceptance Criteria

- [ ] Hien thi danh sach du lieu tho tai trang "Quan ly du lieu" voi bo loc Nam/Thang tu dau.
- [ ] Tim kiem duoc du lieu theo Ten KH, Ma KH, hoac `originId`, hoat dong tren dataset lon ma khong treo UI.
- [ ] Ban ghi khong co `originId` hien thi badge `Legacy` va khong co nut Sua/Xoa.
- [ ] Nut "Xoa" hoat dong: xoa sach tat ca dong lien quan o `BaoCao_PhanBo`, `BaoCao_Fact`, va cuoi cung la `Sheet Data`, khong de orphan rows.
- [ ] Nut "Sua" hoat dong: backend rebuild phan bo tu merged row server-side bang engine goc.
- [ ] API `getRawRecords` tren `doget` kiem tra quyen Admin/Leader truoc khi tra du lieu va khong trust email parameter.
- [ ] API `deleteDataRecord` va `updateDataRecord` tren `dopost` chi xu ly sau khi verify HMAC signature, `timestamp`, `nonce`, va quyen Admin/Leader.
- [ ] `dopost` tu choi request ghi neu thieu/chua ky dung, request het han, hoac `nonce` bi replay.
- [ ] Moi thao tac ghi tao audit log backend du `callerEmail`, action, `originId`, result.
- [ ] Giao dien co loading indicator, badge Legacy ro rang, va thong bao thanh cong/loi day du.

## 6. Files va modules bi anh huong

| File/Module | Hanh dong | Ly do cham vao | Rui ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `doget/doGet.gs` | Sua | Them action `getRawRecords` voi auth check | Medium | Co |
| `doget/Service_Report_Engine.gs` | Sua | Them `getRawDataRecords` (co filter + auth gate) | Medium | Co |
| `doget/Service_Auth.gs` | Doc/Sua | Dung lai auth hien co de check role doget | Low | Co |
| `dopost/doPost.gs` | Sua | Them action `deleteDataRecord`, `updateDataRecord` voi auth + signature verification | High | Co |
| `dopost/Service_Security.gs` hoac `Service_Auth_Post.gs` | Moi/Sua | Verify HMAC signature, TTL, nonce, audit log | High | Co |
| `dopost/Service_Import.gs` | Sua | Trien khai xoa/cap nhat dong bo 3 bang theo `originId` | High | Co |
| `dopost/Service_Allocation.gs` | Doc | Tai su dung `getAllocationObjects` khi rebuild phan bo | Low | Co |
| `client/Code.gs` | Sua | Them proxy functions, ky mutation payload | Medium | Co |
| `client/index.html` | Sua | Them menu item va view "Quan ly du lieu" | Low | N/A |
| `client/scripts.html` | Sua | JS logic (search, badge legacy, delete/edit modal) | Medium | N/A |

## 7. Risk Triage va Review Focus

- **Review required:** Yes
- **Risk hotspots:**
  1. `Service_Import.gs` - logic xoa 3 bang, allowlist merge khi update, thu tu commit.
  2. `doget/doGet.gs` - auth gate cho `getRawRecords`: phai dung `Session.getActiveUser()`, khong dung email param.
  3. `dopost/Service_Security.gs` - HMAC canonical payload, TTL, nonce storage, audit log.
  4. Concurrent access - `LockService` scope va timeout handling.
  5. Deployment mode - doget phai deploy "Execute as: User"; dopost phai giu "Google Account only".
- **Review focus areas:**
  - Deployment mode doget/dopost co duoc ghi ro trong docs va checklist deploy khong?
  - Canonical string cho HMAC co on dinh va khong phu thuoc thu tu key JSON khong?
  - `nonce` co duoc luu/expire du de chong replay khong?
  - Allowlist field co khop voi cau truc cot thuc te cua `Sheet Data` khong?
  - Update step order co nhat quan giua plan, task, va code khong?
- **Known pitfalls:**
  - `deleteRow` trong GAS thay doi index row phia sau, phai scan tu duoi len.
  - Neu doget khong deploy dung "Execute as: User", `Session.getActiveUser()` tra rong, phai fail ro thay vi fallback sang email parameter.
  - HMAC secret khong duoc hardcode trong code/HTML; chi luu trong Script Properties va docs van hanh.
  - `LockService.waitLock(10000)` throw exception neu timeout, phai wrap try/catch.
  - Ban ghi Legacy khong co `originId` dang `ID-*`, can phan biet ro ten cot chua `originId` o tung sheet.

## 8. Chien luoc trien khai

- **Phase strategy:** 4 phase (1: Read/Search/Security foundation, 2: Delete, 3: Update, 4: Polish/Docs).
- **Thu tu trien khai:** backend read+auth -> security helpers -> UI list+search+legacy badge -> backend delete -> backend update -> polish/docs.
- **Thu tu xoa an toan (Delete):** `BaoCao_PhanBo -> BaoCao_Fact -> Sheet Data`.
- **Thu tu ghi an toan (Update):**
  1. Merge allowlist server-side.
  2. Rebuild phan bo in-memory.
  3. Neu rebuild thanh cong: xoa phan bo cu.
  4. Ghi phan bo moi.
  5. Commit cac cell raw allowlisted sau cung.
- **Concurrent access:** Acquire `LockService.getScriptLock().waitLock(10000)` dau moi handler ghi; release trong `finally`.
- **Security envelope cho write-path:** `callerEmail + timestamp + nonce + signature(HMAC canonical payload)`.
- **Yeu cau migration / config / deploy:** Deploy dong thoi ca 3 project GAS; cau hinh HMAC secret trong Script Properties; ghi checklist deploy cho doget/dopost access mode.

## 9. Test Strategy

- **Manual verification:**
  - Case 1: Xoa 1 record co phan bo nhieu nhan vien -> kiem tra 3 sheet sach, khong co orphan rows.
  - Case 2: Sua doanh thu 1 record -> Dashboard/Report nhay so dung theo ty le phan bo.
  - Case 3: Goi thang endpoint `getRawRecords` voi user thuong -> bi tu choi.
  - Case 4: Ban ghi Legacy hien thi badge va khong co nut Sua/Xoa.
  - Case 5: Fetch du lieu voi 500+ dong -> UI khong treo.
  - Case 6: Goi thang `dopost` voi `callerEmail` hop le nhung khong co/khong dung HMAC -> bi tu choi.
  - Case 7: Replay lai cung request ghi (cung `nonce`) -> bi tu choi.

## 10. Rollback Plan

- GAS khong ho tro transaction, chien luoc giam thieu rui ro:
  - **Delete:** Xoa theo thu tu `BaoCao_PhanBo -> BaoCao_Fact -> Sheet Data`; loi o buoc nao log buoc do va abort.
  - **Update:** Rebuild in-memory truoc; chi ghi khi rebuild thanh cong; raw row commit sau cung.
  - Moi thao tac xoa/sua tra ve response bao gom `originId`, buoc da thuc hien, va ly do loi neu co.
  - **Concurrent:** `LockService` timeout (>10s) tra ve ro cho client voi goi y thu lai.
  - **Security:** Neu HMAC secret lo/can rotate, lock write-path tam thoi, rotate Script Properties, redeploy client proxy, va re-verify mutation flows.
  - Google Sheets co Version History; restore thu cong la last resort.

## 11. Tham chieu thuc thi

- Checklist chi tiet theo phase: `FEATURE_TASKS.md`

## 12. Review Notes (v4.0.0 - maximum hardening)

- **Gap 1-10:** Da duoc xu ly qua cac vong review truoc.
- **Gap 11 (Write-path security — v4.0 mandatory hardening)**: Tier 1 (deploy restriction + audit log) và Tier 2 (HMAC + nonce + timestamp TTL) đều bắt buộc. Xử lý tại dopost: verify signature → check TTL → check nonce → check role → thực thi. Long-term fix (backlog Task 4.5): same-project refactor dùng `google.script.run`.
- **Long-term architecture item:** Same-project refactor dung `google.script.run` van la huong chuan sau cung, nhung khong con block feature sau khi da ap Tier 1 + Tier 2.
