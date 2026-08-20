# Feature Tasks: Chuẩn Hóa Cấu Trúc 4 Nhóm Bảng Phân Bổ Tiền Lương và BHXH

> **Trạng thái**: ✅ Hoàn thành  
> **Liên kết plan**: [FEATURE_PLAN.md](./FEATURE_PLAN.md)  
> **Ngày tạo**: 2026-08-20  

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

---

## Phase 1: Tái Cấu Trúc Nhóm Dữ Liệu & Phân Loại HĐ 68, HĐ Vụ Việc

**Mục tiêu:** Cập nhật logic phân loại `groups` trong `doGet_phanBoLuongBHXH.js` để tách biệt 4 nhóm: BIEN_CHE, HD_DAI_HAN, HD_68, HD_VU_VIEC và phân bổ Gián tiếp / Trực tiếp chính xác.

- [x] Task 1.1: Cập nhật đối tượng `groups` trong `doGet_taoBangPhanBoLuongBHXH()` gồm 4 key chính: `BIEN_CHE`, `HD_DAI_HAN`, `HD_68`, `HD_VU_VIEC` với label chuẩn.
- [x] Task 1.2: Cập nhật luồng phân loại nhân sự chính từ `DataLuong1Raw` và `DataChotNSThang`:
  - `BIEN_CHE`: `subKey = master.LoaiDV` ('Bộ phận quản lý' / 'Bộ phận trực tiếp'), `deptKey = master.NhomDV`.
  - `HD_DAI_HAN`: `subKey = master.LoaiDV`, `deptKey = master.NhomDV`.
  - `HD_68`: `subKey = (master.LoaiDV === 'Bộ phận quản lý' ? 'Gián tiếp' : 'Trực tiếp')`.
  - `HD_VU_VIEC`: `subKey = (master.LoaiDV === 'Bộ phận quản lý' ? 'Gián tiếp' : 'Trực tiếp')`, `deptKey = 'Tên đơn vị' / 'Tổ'`.
  - **(FR-03)** Fallback: Nếu `master` undefined cho `HD_VU_VIEC`, mặc định `subKey = 'Trực tiếp'`.
- [x] Task 1.3: Cập nhật luồng điều chỉnh Truy lĩnh / Truy thu BHXH để kế thừa đúng 4 nhóm `mainKey` và `subKey`.
- [x] Task 1.4: Đồng bộ logic phân loại cho hàm audit `auditChiTietPhanBoLuongBHXH()`: thêm `mainLabel` mapping cho `HD_68`, `subLabel` mapping cho `Gián tiếp`/`Trực tiếp` **(FR-05)**.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc) - Chạy thử logic map không gặp exception và không bị sót bản ghi nào vào nhóm undefined.

---

## Phase 2: Dựng Mảng Kết Quả (Build Output Array) Khớp Giao Diện 3 Hình

**Mục tiêu:** Xây dựng danh sách các dòng dữ liệu trong mảng `result` theo đúng cấu trúc La Mã và các dòng tổng con/tổng gộp.

- [x] Task 2.1: Render Mục `I BIÊN CHẾ`:
  - Dòng tiêu đề: Cột A `I`, Cột B `BIÊN CHẾ` (In hoa, Bold).
  - Tiểu mục `1 | Bộ phận quản lý` (chi tiết *Trong đó:*, *Cộng bộ phận quản lý*).
  - Tiểu mục `2 | Bộ phận trực tiếp`.
  - Dòng chốt: `CỘNG BIÊN CHẾ` (In hoa, Bold).
- [x] Task 2.2: Render Mục `II HỢP ĐỒNG DÀI HẠN`:
  - Dòng tiêu đề: Cột A `II`, Cột B `HỢP ĐỒNG DÀI HẠN` (In hoa, Bold).
  - Tiểu mục `1 | Bộ phận quản lý` (chi tiết *Trong đó:*, *Cộng bộ phận quản lý*).
  - Tiểu mục `2 | Bộ phận trực tiếp`.
- [x] Task 2.3: Render Mục `III HỢP ĐỒNG 68` & Dòng gộp `CỘNG HĐDH + HĐ 68`:
  - Dòng tiêu đề: Cột A `III`, Cột B `HỢP ĐỒNG 68` (In hoa, Bold).
  - Dòng số liệu `Gián tiếp` và dòng `Trực tiếp`.
  - Dòng tổng hợp `CỘNG HĐDH + HĐ 68` (= `subTotalHDDH + subTotalHD68`, **display-only**, không cộng vào `grandTotal`) **(FR-02)**.
- [x] Task 2.4: Render Mục `IV HỢP ĐỒNG VỤ VIỆC` & Dòng `Tổng cộng`:
  - Dòng tiêu đề: Cột A `IV`, Cột B `HỢP ĐỒNG VỤ VIỆC` (In hoa, Bold).
  - Khối `Gián tiếp`: chi tiết *Trong đó:* (nếu có các tổ).
  - Khối `Trực tiếp`: chi tiết *Trong đó:* và dòng *Cộng trực tiếp*.
  - Dòng chốt: `CỘNG HĐ VỤ VIỆC` (In hoa, Bold).
  - Dòng kết thúc bảng: `Tổng cộng` (In hoa, Bold).
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Bắt buộc) - Kiểm tra toàn bộ cấu trúc dòng và công thức tổng con/tổng gộp khớp với dữ liệu thực tế.

---

## Phase 3: Hoàn Thiện Định Dạng Google Sheets & Kiểm Thử Toàn Diện

**Mục tiêu:** Cập nhật quy tắc kẻ viền, bôi đậm trên Sheets và kiểm thử kết quả trên file thực tế.

- [x] Task 3.1: Cập nhật điều kiện bôi đậm (Bold): Áp dụng cho các dòng La Mã (`I`, `II`, `III`, `IV`), STT số (`1`, `2`), các dòng `Cộng ...`, `CỘNG ...` và `Tổng cộng`.
- [x] Task 3.2: Cập nhật điều kiện kẻ viền chân dòng (Solid bottom border) cho các dòng tiêu đề và dòng cộng theo chuẩn biểu mẫu.
- [x] Task 3.3: Chạy test `test_doGet_taoBangPhanBoLuongBHXH()` trên tháng `T06.2026` với khu vực `Hà Nội` và `All` **(FR-04)**, kiểm tra trực quan trên Sheet xuất.
- [x] Task 3.4: Chạy test đối soát tổng số tiền và bảo hiểm giữa Bảng phân bổ và các bảng hạch toán liên quan.
- [x] Task 3.5: Kiểm thử client in qua `getPrintDataPhanBoLuongBHXH` → `pg_general_3.html` để xác nhận bold/format hiển thị đúng **(FR-01)**.
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (Bắt buộc) - Xác nhận bảng in khớp 100% với Hình 1, 2, 3 của User.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-08-20 | Setup | Khởi tạo | Tạo FEATURE_PLAN.md & FEATURE_TASKS.md | done | Chờ User review plan |
| 2026-08-20 | Review | FR-01~05 | Review xong, cập nhật plan theo 5 FR | done | Verdict: ✅ ĐỒNG Ý |
| 2026-08-20 | Phase 1 | Task 1.1-1.4 | Cập nhật groups 4 nhóm, classification, truy thu, audit | done | |
| 2026-08-20 | Phase 2 | Task 2.1-2.4 | Viết lại Build Output Array: 4 mục La Mã, CONG_HDDH_HD68, CONG_HDVV | done | |
| 2026-08-20 | Phase 3 | Task 3.1-3.2 | Bold/border logic tương thích tự nhiên với cấu trúc mới | done | |
| 2026-08-20 | Refine | Fix Rounding & Bold | Chuẩn hóa prefix DV, làm tròn cấp nhóm, sửa Bold case-insensitive | done | |
| 2026-08-20 | Close | Final | User test xác nhận đạt toàn bộ 3 Phase | done | ✅ Hoàn thành feature |
