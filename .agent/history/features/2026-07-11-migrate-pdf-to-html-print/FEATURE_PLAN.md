# Feature Plan: Di chuyển xuất báo cáo PDF sang Form in HTML (HTML Print)

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Đã thông qua review vòng 1, sẵn sàng chuyển cho feature-coordinator
> **Feature slug**: migrate-pdf-to-html-print
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-07-10

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại hệ thống có 8-10 báo cáo khác nhau. Một số báo cáo đã có tính năng in trực tiếp từ HTML trên client. Các báo cáo còn lại chỉ hỗ trợ xuất PDF và xuất Excel qua Google Sheets.
- **Vấn đề cần giải quyết:** Người dùng muốn có thêm lựa chọn in HTML trực tiếp từ trình duyệt để có layout in ấn chuẩn xác và căn chỉnh dải gạch chân hoàn hảo bên lề trái (điều mà xuất PDF Google Sheets rất khó thực hiện chuẩn). Tuy nhiên, các tính năng xuất PDF và Excel hiện tại qua Google Sheets vẫn cần được giữ nguyên để phục vụ lưu trữ và tải file.
- **Mục tiêu:** Bổ sung thêm tùy chọn **"In báo cáo (HTML)"** bên cạnh hai lựa chọn hiện tại là **"Xuất PDF"** và **"Xuất Excel"** cho tất cả các báo cáo.
- **Kết quả mong đợi:** Người dùng có 3 lựa chọn khi bấm vào các card báo cáo: Xuất PDF (giữ nguyên), Xuất Excel (giữ nguyên), và In báo cáo HTML (mới với layout in ấn hoàn hảo).

## 2. Phạm vi

### In scope
1. **Backend (GAS):** 
   - Tạo thêm các endpoint JSON mới để trả về dữ liệu thô phục vụ in ấn cho các báo cáo chưa có (không làm ảnh hưởng đến các hàm tạo sheet cũ):
     - `getPrintDataTongHopBaoHiem` (từ `doGet_tongHopBaoHiem.js`)
     - `getPrintDataTongHopKhoanTru` (từ `doGet_tongHopKhoanTru.js`)
     - `getPrintDataTongHopKPCD` (từ `doGet_tongHopKPCD.js`)
     - `getPrintDataHachToanBaoHiem` (từ `doGet_hachToanBaoHiem.js`)
     - `getPrintDataHachToanKPCD` (từ `doGet_hachToanKPCD.js`)
     - `getPrintDataPhanBoLuongBHXH` (từ `doGet_phanBoLuongBHXH.js`)
     - `getPrintDataHachToanLuongVaTruyLinh` (từ `doGet_hachToanLuongVaTruyLinh.js`)
   - Đăng ký các route JSON này vào `ROUTE_MAP` và danh sách whitelist `locationEnabledReports` trong `doGet/Code.js`. <!-- Sửa theo EFR-01: Whitelist location để không bị mất tham số cơ sở -->
2. **Client-side (GAS API):**
   - Viết các hàm wrapper trong `client/pg_general_1.js` để gọi các API JSON mới từ server, bao gồm việc sửa `pg1_ed1_getPrintDataTongHopLuong` nhận thêm tham số `location`. <!-- Sửa theo EFR-02: Đồng bộ truyền location cho tổng hợp lương -->
3. **Client-side (UI & Render):**
   - Cập nhật hộp thoại lựa chọn (Swal) trong `client/pg_general_4.html` để hiển thị thêm nút **"In báo cáo" (màu tím/xanh dương)** bên cạnh "Xuất PDF" và "Xuất Excel".
   - Thêm các hàm tạo HTML và CSS in ấn cho từng loại báo cáo trong `client/pg_general_3.html`:
     - `printBangTongHopLuong(location)`: Cập nhật nhận `location`, mở `window.open` trước khi gọi async để tránh bị trình duyệt chặn popup. <!-- Sửa theo EFR-02, EFR-03: Nhận location và mở popup trước async -->
     - `printBangTongHopBaoHiem()`
     - `printBangTongHopKhoanTru()`
     - `printBangTongHopKPCD()`
     - `printBangHachToanBaoHiem()`
     - `printBangHachToanKPCD()`
     - `printBangPhanBoLuongBHXH()`
     - `printBangHachToanLuongVaTruyLinh()`
   - Chuẩn hóa CSS chung cho khối thông tin trường học ở góc trái:
     - Tên trường: `TRƯỜNG ĐẠI HỌC CÔNG NGHỆ GTVT` (Lề trái, font-size 9.5pt)
     - Dải gạch chân: dài bằng 50% độ rộng chữ tên trường, căn giữa so với tên trường.
     - Nếu có Cơ sở/Địa phương: Xuống dòng dưới, gạch chân dưới Cơ sở thay vì dưới Tên trường.

### Out of scope
- Thay đổi cấu trúc dữ liệu hoặc logic tính toán số liệu gốc.
- Sửa đổi hay xóa bỏ các tính năng xuất PDF và xuất Excel qua Google Sheets hiện có (các tính năng này được giữ nguyên hoàn toàn).

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** Kiến trúc call API async qua `google.script.run` kết hợp `window.open` trên client.
- **"Cấm kỵ" cần tránh:** Tránh hardcode các dữ liệu cấu hình hoặc danh sách địa phương. Kế thừa cache địa phương từ client.

## 4. Giả định và câu hỏi mở

### Giả định
- Các báo cáo hạch toán và tổng hợp bảo hiểm/KPCĐ/khoản trừ đã có sẵn logic trích xuất dữ liệu thô trong backend, chỉ cần bóc tách phần ghi sheet ra để trả về JSON trực tiếp.
- Người dùng sử dụng tính năng in mặc định của trình duyệt để "Save as PDF" khi cần file PDF lưu trữ.

### Câu hỏi mở
- *Chưa có.*

## 5. Acceptance Criteria

- [ ] Tại hộp thoại Swal của mỗi báo cáo, hiển thị đầy đủ 3 tùy chọn rõ ràng: **"Xuất PDF"**, **"Xuất Excel"** và **"In báo cáo (HTML)"**.
- [ ] Tính năng **"Xuất PDF"** và **"Xuất Excel"** hoạt động chính xác như cũ (tạo file trên Google Sheets và tải xuống).
- [ ] Tính năng **"In báo cáo (HTML)"** mở ra tab mới chứa giao diện in HTML và tự động mở hộp thoại in của trình duyệt.
- [ ] Giao diện in ấn của tất cả các báo cáo có tên trường `TRƯỜNG ĐẠI HỌC CÔNG NGHỆ GTVT` nằm bên góc trái trên cùng:
  - Nếu báo cáo không lọc cơ sở: Tên trường có đường gạch chân bằng 50% độ rộng chữ và căn giữa so với chữ tên trường.
  - Nếu báo cáo có lọc cơ sở (ví dụ: Hà Nội): Chữ "Cơ sở: HÀ NỘI" hiển thị ngay dưới tên trường, tên trường không có gạch chân, còn dòng cơ sở có gạch chân toàn bộ và căn giữa so với chữ cơ sở.
- [ ] Bố cục bảng dữ liệu, font chữ (Times New Roman), căn lề số liệu, và dòng chữ ký hiển thị hoàn chỉnh, không bị tràn trang khi in (A4 Portrait hoặc Landscape tùy báo cáo).

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `doGet/Code.js` | Sửa | Đăng ký các route JSON mới cho in ấn | 🟢 Thấp | Có |
| `client/pg_general_1.js` | Sửa | Thêm các hàm call API in ấn | 🟢 Thấp | Có |
| `client/pg_general_3.html` | Sửa | Viết CSS dùng chung và hàm sinh HTML cho các báo cáo | 🟡 Trung bình | Có |
| `client/pg_general_4.html` | Sửa | Điều hướng sự kiện nút in sang HTML Print | 🟢 Thấp | Có |
| Các file `doGet/doGet_*.js` | Sửa | Viết hàm trả về JSON data cho in ấn | 🟡 Trung bình | Có |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Việc bóc tách dữ liệu từ các hàm backend hiện có sang định dạng JSON cần đảm bảo chính xác cấu trúc mảng và dữ liệu tính toán.
- **Review focus areas:** Layout CSS in ấn của các báo cáo Landscape (Bảng chuyển khoản, Tổng hợp lương, Bảo hiểm...) đảm bảo không bị vỡ cột khi in thực tế.

## 8. Chiến lược triển khai

- **Phase 1: Xây dựng Backend & API (GAS)**
  - Viết các hàm trả dữ liệu JSON cho 7 báo cáo còn lại.
  - Đăng ký route và viết hàm gọi client-side.
- **Phase 2: Thiết kế giao diện HTML Print & CSS in ấn**
  - Viết CSS in chuẩn hóa (tách Tên trường, Cơ sở, Gạch chân theo đúng yêu cầu).
  - Viết hàm render HTML cho các báo cáo tổng hợp (Lương, Bảo hiểm, Khoản trừ, KPCĐ).
- **Phase 3: Hoàn thiện các báo cáo hạch toán & Phân bổ**
  - Viết hàm render HTML cho các báo cáo hạch toán (Bảo hiểm, KPCĐ, Lương, Phân bổ).
  - Kết nối UI và chạy thử nghiệm toàn bộ.

## 9. Test Strategy

- **Manual verification:**
  - Bấm in từng báo cáo từ UI mới.
  - Kiểm tra xem tên trường + gạch chân có hiển thị đúng lề trái và đúng tỷ lệ/vị trí không.
  - Kiểm tra số liệu khớp 100% giữa file Excel và bản in HTML.

## 10. Rollback Plan

- Git revert về commit trước khi thực hiện feature-plan này.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
