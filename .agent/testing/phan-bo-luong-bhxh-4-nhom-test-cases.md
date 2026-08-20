# Test Cases: Chuẩn Hóa Cấu Trúc 4 Nhóm Bảng Phân Bổ Tiền Lương và BHXH

> **Feature slug**: `phan-bo-luong-bhxh-4-nhom`  
> **Module liên quan**: `doGet/doGet_phanBoLuongBHXH.js`  
> **Thời gian tạo**: 2026-08-20  

---

## 1. Mục tiêu kiểm thử
Xác minh bảng phân bổ tiền lương và BHXH (`doGet_taoBangPhanBoLuongBHXH`) xuất ra đúng cấu trúc 4 mục La Mã theo chuẩn biểu mẫu kho bạc, không bị sai lệch số liệu, tính toán dòng tổng hợp trung gian chính xác và làm tròn cấp nhóm đúng quy tắc.

---

## 2. Danh sách Test Cases

### TC-01: Kiểm tra cấu trúc 4 nhóm La Mã & định dạng Bold
- **Mục tiêu**: Bảng in hiển thị đầy đủ 4 nhóm I, II, III, IV và các dòng chốt CỘNG... được in đậm (Bold), kẻ viền nét liền (Solid border).
- **Các bước**:
  1. Chạy `test_doGet_taoBangPhanBoLuongBHXH()` trên tháng `T06.2026`, khu vực `Hà Nội`.
  2. Mở file Google Sheets kiểm tra các dòng tiêu đề:
     - Dòng `I` `BIÊN CHẾ` (Bold), tiểu mục `1 | Bộ phận quản lý`, `2 | Bộ phận trực tiếp`, dòng `CỘNG BIÊN CHẾ` (Bold).
     - Dòng `II` `HỢP ĐỒNG DÀI HẠN` (Bold), tiểu mục `1 | Bộ phận quản lý`, `2 | Bộ phận trực tiếp`.
     - Dòng `III` `HỢP ĐỒNG 68` (Bold), nhánh `Gián tiếp`, `Trực tiếp`.
     - Dòng `IV` `HỢP ĐỒNG VỤ VIỆC` (Bold), phân chia `Gián tiếp`, `Trực tiếp`, bung chi tiết mục *Trong đó:* và chốt bằng `CỘNG HĐ VỤ VIỆC` (Bold).
- **Kết quả mong đợi**: Pass. Bảng in hiển thị đúng toàn bộ cấu trúc và định dạng.

### TC-02: Kiểm tra dòng tổng hợp trung gian CỘNG HĐDH + HĐ 68
- **Mục tiêu**: Dòng `CỘNG HĐDH + HĐ 68` tính đúng tổng của Mục II + Mục III và không cộng lặp vào `Tổng cộng`.
- **Các bước**:
  1. Lấy số liệu dòng `CỘNG HĐDH + HĐ 68`.
  2. Đối chiếu với: (Tổng mục II HĐ dài hạn) + (Tổng mục III HĐ 68).
  3. Kiểm tra công thức dòng `Tổng cộng` cuối bảng = Mục I + Mục II + Mục III + Mục IV.
- **Kết quả mong đợi**: Pass. Dòng tổng hợp trung gian chính xác và dòng Tổng cộng không bị cộng thừa.

### TC-03: Kiểm tra làm tròn cấp nhóm (Group-level rounding)
- **Mục tiêu**: Không bị lệch 1 đồng do cộng các số đã làm tròn riêng lẻ; tổng các dòng con khớp chính xác với dòng tổng cha.
- **Các bước**:
  1. Kiểm tra các cột tiền (Cột 12 Tổng lương, Cột 13-16 Bảo hiểm & KPCĐ, Cột 21 Giảm trừ, Cột 23 Thực lĩnh).
  2. Tính tổng thủ công các dòng chi tiết tổ so với dòng `Cộng bộ phận quản lý` / `Cộng trực tiếp`.
- **Kết quả mong đợi**: Pass. Số tiền hiển thị là số nguyên làm tròn chuẩn hàng đơn vị, tổng con khớp 100% với tổng cha.

### TC-04: Kiểm tra chuẩn hóa tiền tố DV cho HĐ vụ việc
- **Mục tiêu**: Cán bộ HĐ vụ việc có mã đơn vị dạng `0092` từ `DataChotNSThang` được nhận diện đúng `LoaiDV = 'Bộ phận quản lý'` và hiển thị vào nhánh Gián tiếp.
- **Các bước**:
  1. Kiểm tra nhân sự `CB580` và `CB69` thuộc `0092 - Tổ Hành chính - Văn thư và Quản lý GD`.
  2. Xác nhận tổ `0092` xuất hiện dưới nhánh `Gián tiếp -> Trong đó:` của Mục IV.
- **Kết quả mong đợi**: Pass. Tổ `0092` nằm đúng ở nhánh Gián tiếp của HĐ vụ việc.

### TC-05: Kiểm tra hàm Audit chi tiết từng cán bộ
- **Mục tiêu**: Hàm `auditChiTietPhanBoLuongBHXH()` bóc tách danh sách từng Mã CB, phân loại khớp với bảng phân bổ.
- **Các bước**:
  1. Chạy hàm `test_auditChiTietPhanBoLuongBHXH()` trên Apps Script.
  2. Mở sheet `Audit_PhanBoLuongBHXH` trong file kết xuất.
- **Kết quả mong đợi**: Pass. Sheet audit hiển thị đầy đủ 31 cột với chi tiết từng Mã CB, loại hợp đồng và dòng phân bổ báo cáo.
