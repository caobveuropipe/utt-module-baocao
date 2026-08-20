# Feature Plan: Chuẩn Hóa Cấu Trúc 4 Nhóm Bảng Phân Bổ Tiền Lương và BHXH

> **Trạng thái**: ✅ ĐỒNG Ý  
> **Review gate**: Đã review (FR-01~FR-05 đã xử lý)  
> **Feature slug**: `phan-bo-luong-bhxh-4-nhom`  
> **Tạo bởi**: feature-plan  
> **Ngày tạo**: 2026-08-20  

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Báo cáo "Bảng phân bổ tiền lương và BHXH" (`doGet_phanBoLuongBHXH.js`) phục vụ công tác đối soát kế toán và nộp kho bạc, hiện đang gộp chung HĐ 68 vào mục HĐ dài hạn và hiển thị HĐ vụ việc theo danh sách phẳng đơn vị mà chưa phân rõ trực tiếp / gián tiếp theo chuẩn biểu mẫu kho bạc.
- **Vấn đề cần giải quyết:** 
  1. Thiếu tiêu đề đánh số La Mã `I BIÊN CHẾ`, dòng kết luận chưa viết in hoa, bold chuẩn `CỘNG BIÊN CHẾ`.
  2. Mục Lương HĐ dài hạn cần chuyển thành mục `II HỢP ĐỒNG DÀI HẠN` (in hoa, bold).
  3. Hợp đồng 68 cần tách thành mục riêng `III HỢP ĐỒNG 68` phân định rõ 2 nhánh: *Gián tiếp* và *Trực tiếp*, sau đó có dòng tổng hợp `CỘNG HĐDH + HĐ 68`.
  4. Mục Hợp đồng vụ việc cần chuẩn hóa thành mục `IV HỢP ĐỒNG VỤ VIỆC` (in hoa, bold), cũng phân chia theo *Gián tiếp* và *Trực tiếp* (kèm chi tiết các tổ dưới mục *Trong đó:* và dòng *Cộng trực tiếp* nếu có), kết thúc bằng dòng `CỘNG HĐ VỤ VIỆC` (in hoa, bold).
- **Mục tiêu:** Cập nhật toàn bộ thuật toán gom nhóm và render bảng Excel/PDF trong file `doGet_phanBoLuongBHXH.js` (và hàm audit `auditChiTietPhanBoLuongBHXH`) để bảng in ra khớp 100% với định dạng biểu mẫu yêu cầu (Hình 1, Hình 2, Hình 3).
- **Kết quả mong đợi:** Bảng xuất Excel/PDF và dữ liệu in client hiển thị chính xác cấu trúc 4 mục La Mã (I, II, III, IV), các dòng cộng tiểu mục, cộng gộp HĐDH + HĐ 68 và tổng cộng toàn trường đúng số liệu, đúng style (Bold, In hoa, viền nét liền/đứt).

---

## 2. Phạm vi

### In scope
- Cập nhật cấu trúc nhóm dữ liệu `groups` trong `doGet_phanBoLuongBHXH.js`:
  - Nhóm `I` (`BIEN_CHE`): Tiêu đề `I | BIÊN CHẾ`, tiểu mục `1 | Bộ phận quản lý` (chi tiết *Trong đó* và *Cộng bộ phận quản lý*), `2 | Bộ phận trực tiếp`, dòng chốt `CỘNG BIÊN CHẾ` (In hoa, Bold).
  - Nhóm `II` (`HD_DAI_HAN`): Tiêu đề `II | HỢP ĐỒNG DÀI HẠN`, tiểu mục `1 | Bộ phận quản lý` (chi tiết *Trong đó* và *Cộng bộ phận quản lý*), `2 | Bộ phận trực tiếp`.
  - Nhóm `III` (`HD_68`): Tiêu đề `III | HỢP ĐỒNG 68`, phân bổ theo *Gián tiếp* và *Trực tiếp*.
  - Dòng tổng hợp trung gian: `CỘNG HĐDH + HĐ 68` (Cộng gộp Nhóm II + Nhóm III).
  - Nhóm `IV` (`HD_VU_VIEC`): Tiêu đề `IV | HỢP ĐỒNG VỤ VIỆC`, phân bổ theo *Gián tiếp* (chi tiết *Trong đó:*) và *Trực tiếp* (chi tiết *Trong đó:* -> *Cộng trực tiếp*), dòng chốt `CỘNG HĐ VỤ VIỆC` (In hoa, Bold).
- Cập nhật luồng xử lý điều chỉnh Truy lĩnh / Truy thu BHXH khớp với 4 nhóm trên.
- Cập nhật logic format Google Sheets (in đậm dòng tiêu đề La Mã, các dòng CỘNG in hoa, kẻ border nét liền dưới các dòng tổng).
- Đồng bộ hàm kiểm tra/audit `auditChiTietPhanBoLuongBHXH`.

### Out of scope
- Không thay đổi logic đọc dữ liệu nguồn của các bảng khác (`doGet_hachToanLuongVaTruyLinh.js`, `doGet_tongHopLuong.js`, `doGet_hachToanKPCD.js`...).
- Không thay đổi danh mục Master Data `Setup` trên Google Drive.

---

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** 
  - Kế thừa cơ chế ánh xạ nhân sự từ `DataChotNSThang` (ưu tiên) kết hợp Master Data `Setup!K:O` để xác định loại hợp đồng (`LoaiHD`), tính chất đơn vị (`LoaiDV`: Quản lý/Gián tiếp vs Trực tiếp) và nhóm đơn vị (`NhomDV`).
  - Tuân thủ cơ chế truy thu/truy lĩnh bảo hiểm gán theo `MaCB` vào đúng nhánh phân bổ.
- **"Cấm kỵ" cần tránh:** 
  - Tuyệt đối không làm lệch tổng số liệu lương, bảo hiểm (`BHXH`, `BHYT`, `BHTN`, `KPCĐ`, `Tổng lương`, `Giảm trừ`, `Số tiền được lĩnh`) tại dòng `Tổng cộng`.
  - Không phá vỡ số lượng 23 cột chuẩn của bảng phân bổ để tránh lỗi template và client in.
- **Ràng buộc kiến trúc liên quan:** Phải đảm bảo API `getPrintDataPhanBoLuongBHXH` và export PDF trả về đúng vùng dữ liệu từ dòng 7 trở đi mà không bị lỗi merged cells.

---

## 4. Giả định và câu hỏi mở

### Giả định
1. Phân loại Gián tiếp vs Trực tiếp cho HĐ 68 và HĐ Vụ việc: Căn cứ vào cột `LoaiDV` (Cột O trong `Setup`) của mã đơn vị (`MaDonVi`) tương ứng của nhân sự:
   - Nếu `LoaiDV` là `Bộ phận quản lý` (hoặc chứa từ khóa `Quản lý` / `Gián tiếp`) -> Xếp vào nhánh **Gián tiếp**.
   - Nếu `LoaiDV` là `Bộ phận trực tiếp` (hoặc các khoa, trung tâm, tổ sản xuất/dịch vụ) -> Xếp vào nhánh **Trực tiếp**.
   - **Fallback (FR-03):** Nếu cán bộ HĐ vụ việc không có trong `mapMaster` (`master` undefined), mặc định xếp vào nhánh **Trực tiếp**.
2. Chi tiết phòng ban dưới mục "Trong đó:" của HĐ Vụ việc được nhóm theo `Tên đơn vị` / `Tổ chuyên môn` từ `DataChotNSThang` hoặc `Setup`.
3. Định dạng chữ: Tất cả các dòng mục chính La Mã (`I BIÊN CHẾ`, `II HỢP ĐỒNG DÀI HẠN`, `III HỢP ĐỒNG 68`, `IV HỢP ĐỒNG VỤ VIỆC`) và các dòng chốt (`CỘNG BIÊN CHẾ`, `CỘNG HĐDH + HĐ 68`, `CỘNG HĐ VỤ VIỆC`, `Tổng cộng`) đều được set `setFontWeight('bold')`, chữ in hoa.
4. **(FR-02)** Dòng `CỘNG HĐDH + HĐ 68` là **display-only**: được tính bằng `subTotalHDDH + subTotalHD68` chỉ dùng để render hiển thị, **KHÔNG** cộng vào `grandTotal`. `grandTotal = subtotal(I) + subtotal(II) + subtotal(III) + subtotal(IV)`.

### Câu hỏi mở
- Không có điểm blocking.

---

## 5. Acceptance Criteria

- [ ] **Mục I BIÊN CHẾ**: Cột A hiển thị `I`, cột B hiển thị `BIÊN CHẾ` (In hoa, Bold). Dưới gồm `1 | Bộ phận quản lý` (chi tiết *Trong đó:*, *Cộng bộ phận quản lý*), `2 | Bộ phận trực tiếp`, và kết thúc bằng dòng `CỘNG BIÊN CHẾ` (In hoa, Bold).
- [ ] **Mục II HỢP ĐỒNG DÀI HẠN**: Cột A hiển thị `II`, cột B hiển thị `HỢP ĐỒNG DÀI HẠN` (In hoa, Bold). Dưới gồm `1 | Bộ phận quản lý` (chi tiết *Trong đó:*, *Cộng bộ phận quản lý*), `2 | Bộ phận trực tiếp`.
- [ ] **Mục III HỢP ĐỒNG 68**: Cột A hiển thị `III`, cột B hiển thị `HỢP ĐỒNG 68` (In hoa, Bold). Tách thành 2 dòng số liệu: `Gián tiếp` và `Trực tiếp`.
- [ ] **Dòng CỘNG HĐDH + HĐ 68**: Xuất hiện ngay sau mục III, tính tổng gộp của Mục II và Mục III (In hoa, Bold).
- [ ] **Mục IV HỢP ĐỒNG VỤ VIỆC**: Cột A hiển thị `IV`, cột B hiển thị `HỢP ĐỒNG VỤ VIỆC` (In hoa, Bold). Phân chia thành nhánh *Gián tiếp* (kèm các tổ quản lý nếu có) và *Trực tiếp* (kèm các tổ trực tiếp, dòng *Cộng trực tiếp*), kết thúc bằng dòng `CỘNG HĐ VỤ VIỆC` (In hoa, Bold).
- [ ] **Dòng Tổng cộng**: Nằm ở cuối bảng, bằng tổng Mục I + (Mục II + Mục III) + Mục IV, khớp 100% với số liệu tổng lương và các khoản trích nộp.
- [ ] **Định dạng & Viền (Border)**: Các dòng tiêu đề và dòng cộng đều in đậm, chân dòng có viền nét liền (Solid), nội dung chi tiết có viền ngang nét đứt (Dotted).
- [ ] **Test Execution**: Chạy thử hàm `test_doGet_taoBangPhanBoLuongBHXH()` và `test_auditChiTietPhanBoLuongBHXH()` trên tháng `T06.2026` không gặp lỗi, xuất sheet thành công.

---

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|  
| `doGet/doGet_phanBoLuongBHXH.js` | Sửa | Cập nhật thuật toán gom nhóm 4 mục, tạo mảng kết quả và format bảng tính trên Sheets | 🟡 | Giữ nguyên 23 cột dữ liệu và interface hàm |
| `client/pg_general_3.html` | Kiểm tra (FR-01) | Client-side rendering phụ thuộc cấu trúc output array (bold detection bằng Roman numeral & "cộng" keyword) | 🟢 | Không cần sửa code, chỉ test tương thích |

---

## 7. Risk Triage và Review Focus

- **Review required:** Khuyến nghị gọi `feature-review`.
- **Risk hotspots:**
  - Logic xác định nhánh *Gián tiếp* vs *Trực tiếp* cho cán bộ `HĐ 68` và `HĐ vụ việc` cần đảm bảo không bỏ sót cán bộ nào hoặc để rơi vào nhánh undefined.
  - Phép tính tổng gộp `CỘNG HĐDH + HĐ 68` và `Tổng cộng` cần cộng đúng các đối tượng tích lũy `subTotal` mà không bị cộng lặp 2 lần.
  - Xử lý mảng truy thu/truy lĩnh bảo hiểm cần map đúng `mainKey` (`HD_68` thay vì gộp chung vào `HD_DAI_HAN`).
- **Review focus areas:**
  - Kiểm tra thứ tự và cấu trúc dòng xuất ra của mảng `result` có khớp chính xác từng dòng trong Hình 1, 2, 3 hay không.
  - Kiểm tra style border và font bold trên Google Sheets.
- **Known pitfalls:** Lưu ý không để các dòng tiêu đề rỗng (như dòng chứa chữ `Trong đó:`) mang số liệu 0 làm rối mắt bảng in.

---

## 8. Chiến lược triển khai

- **Phase 1:** Tái cấu trúc bộ nhớ lưu trữ `groups` và phân loại dữ liệu đầu vào:
  - Tách nhóm `HD_68` thành nhóm độc lập với 2 subKey: `Gián tiếp`, `Trực tiếp`.
  - Nâng cấp nhóm `HD_VU_VIEC` để phân loại theo `Gián tiếp` và `Trực tiếp`.
  - Cập nhật bộ gán truy lĩnh / truy thu tương thích.
- **Phase 2:** Cập nhật hàm dựng mảng dữ liệu `result` (Build Output Array):
  - Render Mục `I BIÊN CHẾ` -> `CỘNG BIÊN CHẾ`.
  - Render Mục `II HỢP ĐỒNG DÀI HẠN` -> `1. Bộ phận quản lý`, `2. Bộ phận trực tiếp`.
  - Render Mục `III HỢP ĐỒNG 68` -> `Gián tiếp`, `Trực tiếp`.
  - Render dòng tổng hợp `CỘNG HĐDH + HĐ 68`.
  - Render Mục `IV HỢP ĐỒNG VỤ VIỆC` -> `Gián tiếp` (Trong đó: ...), `Trực tiếp` (Trong đó: ..., Cộng trực tiếp) -> `CỘNG HĐ VỤ VIỆC`.
  - Render dòng `Tổng cộng`.
- **Phase 3:** Hoàn thiện format Sheets & Test xác minh:
  - Cập nhật quy tắc bôi đậm (Bold) và kẻ viền (Border) tương ứng.
  - Chạy test kiểm thử dữ liệu tháng `T06.2026` khu vực `Hà Nội` và `All`.

---

## 9. Test Strategy

- **Automated / GAS Execution Tests:**
  - Chạy `test_doGet_taoBangPhanBoLuongBHXH()` để kiểm tra sinh bảng trên file Google Sheets.
  - Chạy `test_auditChiTietPhanBoLuongBHXH()` để kiểm tra danh sách phân loại nhân sự.
- **Manual Verification:**
  - Mở trực tiếp file Google Sheets kiểm tra giao diện trực quan so với 3 hình ảnh người dùng đã gửi.
  - Đối chiếu số tổng từng cột: Cột 12 (Tổng lương), Cột 13 (BHXH), Cột 14 (BHYT), Cột 15 (BHTN), Cột 16 (KPCĐ), Cột 21 (Cộng giảm trừ), Cột 23 (Số tiền được lĩnh).

---

## 10. Rollback Plan

- File `doGet_phanBoLuongBHXH.js` được sao lưu trạng thái trước khi sửa. Nếu phát sinh sai lệch, khôi phục lại code hiện tại từ Git/Backup.

---

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: [FEATURE_TASKS.md](./FEATURE_TASKS.md)
