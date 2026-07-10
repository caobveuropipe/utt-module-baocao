# Feature Plan: Quản Lý Danh Mục Mở Rộng (Dictionary Management)

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Đã Pass Council Review (20/04/2026) - Sẵn sàng cho feature-coordinator
> **Feature slug**: dictionary-management
> **Tạo bởi**: feature-coordinator (Refined)
> **Ngày tạo**: 2026-04-19

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Thuật toán phân bổ tại `Service_Allocation.gs` phụ thuộc trực tiếp vào 2 bảng danh mục `DanhSachNhanVien` và `DanhMucSPDV`. Hiện tại việc cập nhật 2 bảng này đang làm thủ công trên Spreadsheet, dễ sai sót và không có luồng quản trị an toàn trên Web UI.
- **Vấn đề cần giải quyết:**
  1. Chưa có giao diện quản lý danh mục trên SPA.
  2. Không được để `HMAC_SECRET` lộ ra browser hoặc source frontend.
  3. Cần một write-path an toàn, nhất quán với kiến trúc 3 project hiện có (`client`, `doget`, `dopost`).
  4. Cần giữ tương thích ngược cho file Excel cũ chưa có `Mã SP`.
- **Mục tiêu:** Cung cấp giao diện quản lý danh mục có quyền hạn rõ ràng, write-path an toàn qua proxy server-side, và fallback lookup ổn định để báo cáo phân bổ không bị gãy khi dữ liệu cũ thiếu mã.

## 2. Phạm vi

### In scope
- Read API và Write API cho `DanhSachNhanVien` và `DanhMucSPDV`.
- UI quản lý danh mục với 2 sub-tab: `Nhân sự` và `Sản phẩm & Dịch vụ`.
- Phân quyền hiển thị và phân quyền ghi thống nhất trên `client`, `doget`, `dopost`.
- Cập nhật `Service_Allocation.gs` để lookup theo `Mã SP` trước, fallback theo `Tên DV-SP` đã normalize khi mã trống hoặc không khớp.

### Out of scope
- Quản lý danh mục khách hàng.
- Soft delete, versioning theo từng dòng, import/export dictionary ở v1.
- Thay đổi header hiện tại của 2 sheet danh mục.

## 3. Kiến trúc và quyết định bảo mật

- **Kiến trúc giữ nguyên:** 3 project tách biệt:
  - `client`: UI và lớp proxy qua `Code.gs`
  - `doget`: read-only API
  - `dopost`: write-path và business validation
- **Quy tắc phân quyền duy nhất:**
  - `Write access`: `Admin` hoặc `Leader` có quyền `dictionary_mgr`
  - `Read access`: user đã đăng nhập có thể xem nếu được vào dashboard liên quan
- **Nguyên tắc bắt buộc:** `HMAC_SECRET` không được render xuống browser.
- **Cơ chế write-path chính thức:**
  - `client/index.html` và `client/scripts.html` chỉ gọi `google.script.run`
  - `client/Code.gs` ký payload ở server-side bằng `HMAC_SECRET` rồi proxy sang `dopost`
  - `doget` chỉ trả dữ liệu và capability flags
  - `dopost` xác thực lại chữ ký, timestamp, nonce replay và quyền người dùng trước khi ghi
- **Câu chốt để implement:** Quyền ghi danh mục chỉ dành cho Admin hoặc Leader có quyền `dictionary_mgr`. `HMAC_SECRET` không được render ra frontend; thay vào đó client project sẽ ký payload ở server-side qua `Code.gs` và `dopost` sẽ xác thực lại chữ ký, nonce, timestamp và quyền người dùng trước khi ghi dữ liệu.

## 4. Data Contract

### 4.1. Contract cho `DanhSachNhanVien`
- Dùng nguyên header hiện tại: `STT | Mã NV | Họ tên | Bộ phận`
- `Họ tên` là bắt buộc
- `Bộ phận` là bắt buộc và chỉ nhận: `BS`, `DD`, `Sale`, `CSKH`
- `Mã NV` được phép trống để giữ tương thích ngược, nhưng nếu có thì phải duy nhất
- Tên nhân sự sau khi normalize không được trùng nhau theo kiểu gây lookup mơ hồ

### 4.2. Contract cho `DanhMucSPDV`
- Dùng nguyên header hiện tại trong `Service_Setup.gs`
- `Tên DV-SP` là bắt buộc
- `Mã SP` được phép trống để giữ tương thích ngược, nhưng nếu có thì phải duy nhất
- Nếu `Mã SP` trống thì hệ thống fallback theo `Tên DV-SP` đã normalize
- Không cho phép dữ liệu trùng tên theo kiểu làm fallback lookup trở nên mơ hồ khi không có mã

### 4.3. Contract ghi dữ liệu
- UI cho phép thêm/sửa/xóa trên local state
- Khi bấm lưu, backend dùng mô hình `full-list replace` theo từng dictionary
- Chỉ xóa phần data rows, luôn giữ nguyên header row
- `LockService.getScriptLock()` là bắt buộc để tránh ghi chèn khi nhiều người lưu gần đồng thời

## 5. API Contract

- **Read API:** `action=getDictionaries`
  - Trả về 2 list dictionary
  - Trả về `capabilities.canManageDictionary`
  - Không trả `HMAC_SECRET` dưới bất kỳ hình thức nào
- **Write API:** `action=updateDictionary`
  - Payload tối thiểu gồm:
    - `action`
    - `dictionaryType`
    - `rows`
    - `callerEmail`
    - `timestamp`
    - `nonce`
    - `signature`
  - `dopost` phải xử lý theo thứ tự:
    1. verify signature
    2. verify timestamp
    3. verify nonce replay
    4. re-check quyền từ `PhanQuyen`
    5. validate schema và dữ liệu
    6. lock và ghi sheet

## 6. Acceptance Criteria

- [ ] (AC1) Xem được 2 sub-tab danh mục: `Nhân sự` và `Sản phẩm & Dịch vụ`.
- [ ] (AC2) Chỉ `Admin` hoặc `Leader` có quyền `dictionary_mgr` mới thấy nút quản lý và nút lưu.
- [ ] (AC3) Browser không chứa `HMAC_SECRET` trong HTML, script context hoặc state của frontend.
- [ ] (AC4) `saveDictionary` bị từ chối nếu sai chữ ký, replay nonce, timestamp hết hạn hoặc không đủ quyền.
- [ ] (AC5) Ghi sheet bằng `full-list replace` nhưng vẫn giữ nguyên header row và không làm lệch cấu trúc bảng.
- [ ] (AC6) Khi 2 người lưu gần đồng thời, sheet vẫn đúng cấu trúc và không bị race-condition.
- [ ] (AC7) `Service_Allocation.gs` lookup theo `Mã SP` trước, fallback theo `Tên DV-SP` đã normalize khi mã trống hoặc không khớp.
- [ ] (AC8) Fallback theo tên không được crash khi gặp dữ liệu mơ hồ; hệ thống phải rơi về hành vi an toàn.
- [ ] (AC9) Sau khi lưu thành công, UI tải lại dữ liệu canonical mới nhất từ server.

## 7. Files và modules bị ảnh hưởng

| File | Hành động | Vai trò |
|------|-----------|---------|
| `doget/doGet.gs` | Sửa | Mở read API `getDictionaries` và trả capability flags |
| `client/Code.gs` | Sửa | Proxy read/write server-side và ký payload |
| `dopost/doPost.gs` | Sửa | Xử lý `updateDictionary` |
| `dopost/Service_Security.gs` | Sửa | Bổ sung rule phân quyền ghi dictionary |
| `dopost/Service_Allocation.gs` | Sửa | Fallback theo tên đã normalize |
| `client/index.html` | Sửa | Khu vực UI dictionary management |
| `client/scripts.html` | Sửa | Local state, render tab, submit flow qua `google.script.run` |

## 8. Risk Triage và Review Focus

- **Risk hotspots:**
  - Lệch rule phân quyền giữa `doget`, `client`, `dopost`
  - `clearContents()` và `setValues()` khi payload lỗi hoặc thiếu cột
  - Fallback theo tên gây match sai khi dữ liệu trùng tên
  - Replay request và sai chữ ký
- **Review focus:**
  - Có loại bỏ hoàn toàn secret khỏi browser chưa
  - `dopost` có re-check quyền bằng `callerEmail` và `PhanQuyen` chưa
  - Có validate xong toàn bộ trước khi wipe dữ liệu cũ chưa
  - Fallback theo tên có deterministic và an toàn chưa

## 9. Test Strategy

- **Authorization**
  - `Admin` được xem và lưu
  - `Leader` không có `dictionary_mgr` xem được nhưng bị chặn save
  - `Leader` có `dictionary_mgr` được lưu
  - User thường không thấy nút quản lý và direct POST bị từ chối
- **Security**
  - Chữ ký sai bị chặn
  - Timestamp quá hạn bị chặn
  - Nonce replay bị chặn
- **Validation**
  - Thiếu field bắt buộc bị reject
  - Duplicate mã bị reject
  - Duplicate tên fallback gây mơ hồ bị reject
  - Bộ phận không hợp lệ bị reject
- **Concurrency**
  - 2 người save gần đồng thời không làm lệch dữ liệu
- **Compatibility**
  - Allocation vẫn chạy khi có `Mã SP`
  - Allocation vẫn chạy khi file Excel cũ không có `Mã SP` nhưng có `Tên DV-SP`
  - **Business - Fallback**: Xóa Mã SP trong file Excel tải lên, kiểm tra báo cáo có trúng đúng dịch vụ dựa trên Tên không.

## 10. Quy trình Kiểm thử (Testing Process)

Quy trình này áp dụng cho từng Phase để đảm bảo tính sẵn sàng trước khi đi tiếp.

### Bước 1: AI Self-Verification (Tầng Logic)
- **Hành động**: AI tạo mock payload và simulate các điều kiện biên trong suy luận hoặc script test tại folder `scratch/`.
- **Mục tiêu**: Phát hiện lỗi cú pháp, lỗi logic gác cổng (gating) và sai lệch contract trước khi deploy thật.

### Bước 2: API Smoke Test (Tầng Backend)
- **Hành động**: Sau khi user deploy code GAS mới, AI sẽ tạo các URL/Request (curl-like) để user thực hiện gọi API trực tiếp.
- **Mục tiêu**: Xác thực 4 lớp bảo mật (HMAC, Nonce, Time, Role) và tính Atomic của Write-path.

### Bước 3: UI-Driven E2E Test (Tầng Frontend)
- **Hành động**: Thao tác trực tiếp trên giao diện: Thêm, Sửa, Xóa, Lưu.
- **Mục tiêu**: Đảm bảo UX trơn tru, logic Local State khớp với Backend và UI tự động Refresh đúng dữ liệu mới nhất.

### Bước 4: Regression & Compatibility Test (Tầng Dữ liệu)
- **Hành động**: Chạy lại thuật toán Allocation trên dữ liệu vừa được cập nhật qua UI.
- **Mục tiêu**: Đảm bảo việc ghi danh mục không làm hỏng tính năng cốt lõi của dự án (Phân bổ doanh thu).

## 11. Rollback Plan

- **Data:** Khôi phục sheet qua `Version History` của Google Drive.
- **Code:** Rollback về bản triển khai ổn định gần nhất của từng project rồi deploy lại đồng bộ `client`, `doget`, `dopost`.
