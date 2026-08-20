# Feature Plan: In Danh sách treo chưa chi trả tiền lương (Phú Thọ)

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Đã thông qua hội đồng review kỹ thuật. Sẵn sàng handoff sang `feature-coordinator`.
> **Feature slug**: `danh-sach-treo-luong`
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-08-20

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại cơ sở Phú Thọ đang loại bỏ các nhân sự có trạng thái "Đi công tác NN" hoặc "Đi NN" ra khỏi "Danh sách chuyển khoản tiền lương, thu nhập tăng thêm, truy lĩnh và truy thu".
- **Vấn đề cần giải quyết:** Cần có chức năng in riêng "Danh sách treo chưa chi trả tiền lương" dành cho các nhân sự bị loại trừ này ở cơ sở Phú Thọ, giữ nguyên mẫu biểu, công thức tính và định dạng như Bảng chuyển khoản, chỉ thay đổi tiêu đề bảng thành `DANH SÁCH TREO CHƯA CHI TRẢ TIỀN LƯƠNG`.
- **Mục tiêu:** 
  1. Thêm API/hàm lấy dữ liệu in cho danh sách treo lương ở backend (`doGet_tongHopCk.js` & `Code.js`).
  2. Bổ sung modal lựa chọn khi bấm nút In bảng chuyển khoản tại cơ sở Phú Thọ (gồm 2 nút: "In bảng chuyển khoản" và "In bảng treo lương").
  3. Đổ dữ liệu và render đúng tiêu đề `DANH SÁCH TREO CHƯA CHI TRẢ TIỀN LƯƠNG` khi chọn in bảng treo lương.

## 2. Phạm vi

### In scope
- Backend: Thêm parameter/flag `isTreoLuong` hoặc hàm `getPrintDataTreoLuong` trong `doGet_tongHopCk.js` để lọc duy nhất nhân sự thuộc cơ sở Phú Thọ có trạng thái `Đi công tác NN` / `Đi NN`.
- API Routing: Đăng ký router `getPrintDataTreoLuong` (hoặc xử lý qua `getPrintDataCk` với tham số `isTreoLuong`) trong `doGet/Code.js`.
- Client Proxy & UI:
  - Cập nhật handler nút In bảng CK trong `client/pg_general_3.html` (hoặc `client/pg_general_1.js`).
  - Khi chọn cơ sở `Phú Thọ` -> Hiển thị Modal/Dialog cho người dùng chọn "In bảng chuyển khoản" hoặc "In bảng treo lương". Nếu chọn cơ sở khác -> In trực tiếp bảng chuyển khoản bình thường.
  - Cập nhật hàm tạo HTML in (`generateCkHtml`) để đổi tiêu đề thành `DANH SÁCH TREO CHƯA CHI TRẢ TIỀN LƯƠNG` khi in bảng treo lương.

### Out of scope
- Thay đổi cấu trúc các cột, công thức tính lương/truy lĩnh/truy thu/ăn ca của Bảng chuyển khoản.
- Áp dụng danh sách treo lương cho các cơ sở khác ngoài Phú Thọ (các cơ sở khác không có danh sách treo lương này).

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** 
  - Đọc dữ liệu nhân sự chốt tháng từ `DataChotNSThang` (Sheets API v4 / `SpreadsheetApp` theo quy chuẩn `GLOBAL_CONFIG`).
  - Đảm bảo tuân thủ routing `doGet` với tham số `type` rõ ràng.
- **"Cấm kỵ" cần tránh:** 
  - Không làm thay đổi logic lọc hiện tại của Bảng chuyển khoản chuẩn (bảng CK chuẩn của Phú Thọ vẫn loại bỏ nhân sự đi NN).
  - Không sửa trực tiếp làm vỡ giao diện in hiện có của các cơ sở khác.
- **Ràng buộc kiến trúc liên quan:** 
  - Tách biệt UI (HTML/JS client) và Backend Read API (`doGet`).

## 4. Giả định và câu hỏi mở

### Giả định
- Mẫu in (cấu trúc cột, tổng cộng, chữ ký, định dạng số) của Bảng treo lương hoàn toàn giống 100% với Bảng chuyển khoản, chỉ khác tiêu đề chính của bảng.
- Danh sách treo lương áp dụng cho cơ sở Phú Thọ đối với những người có `trangThai` thuộc nhóm `Đi công tác NN` hoặc `Đi NN`.

### Câu hỏi mở
- Không có câu hỏi blocking.

## 5. Acceptance Criteria

- [ ] Khi chọn cơ sở **Phú Thọ** và bấm nút **In** (Bảng chuyển khoản), hệ thống hiển thị Modal yêu cầu chọn: `In bảng chuyển khoản` hoặc `In bảng treo lương`.
- [ ] Khi chọn cơ sở khác (vd: Hà Nội, All), hệ thống thực hiện in Bảng chuyển khoản ngay lập tức như hiện tại.
- [ ] Chọn `In bảng chuyển khoản` (Phú Thọ): Ra trang in bảng CK bình thường (đã loại bỏ người đi công tác NN).
- [ ] Chọn `In bảng treo lương` (Phú Thọ): Ra trang in với tiêu đề `DANH SÁCH TREO CHƯA CHI TRẢ TIỀN LƯƠNG`, danh sách chỉ chứa những người thuộc Phú Thọ có trạng thái `Đi công tác NN` / `Đi NN`.
- [ ] Dữ liệu lương, các cột thành phần, tổng số tiền bằng chữ, định dạng hiển thị giữ nguyên chuẩn xác theo mẫu Bảng chuyển khoản.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `doGet/doGet_tongHopCk.js` | Sửa | Thêm tham số `isTreoLuong` hoặc hàm lấy dữ liệu treo lương | 🟢 Thấp | Cung cấp data array 2D đúng định dạng |
| `doGet/Code.js` | Sửa | Đăng ký route API `getPrintDataTreoLuong` hoặc xử lý tham số mới | 🟢 Thấp | Route qua `ROUTE_MAP` |
| `client/pg_general_1.js` | Sửa | Thêm hàm proxy client gọi API lấy dữ liệu in treo lương | 🟢 Thấp | Trả về Promise / callback đúng định dạng |
| `client/pg_general_3.html` | Sửa | Bổ sung Modal chọn loại bảng in khi ở Phú Thọ & cập nhật tiêu đề HTML in | 🟢 Thấp | Đảm bảo UI mượt mà, không lặp modal |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** 
  - Cần kiểm tra kỹ logic lọc nhân sự đi NN (chuẩn hóa chuỗi UTF-8 / NFC để tránh sót trạng thái).
  - Đảm bảo Modal trên client hiển thị đúng lúc và ẩn đúng lúc, không làm đứt gãy luồng in của các cơ sở khác.
- **Review focus areas:** 
  - Hàm `doGet_tongHopDiNganHang` xử lý cờ `isTreoLuong` có làm ảnh hưởng đến các nơi khác gọi hàm này hay không.
- **Known pitfalls / historical issues:** 
  - So sánh chuỗi Tiếng Việt có dấu (`Đi công tác NN` vs `đi công tác nn`) cần dùng `normalize('NFC').trim().toLowerCase()`.

## 8. Chiến lược triển khai

- **Phase strategy:** 
  - Phase 1: Nâng cấp Backend (`doGet_tongHopCk.js` & `Code.js`) để hỗ trợ query danh sách treo lương.
  - Phase 2: Nâng cấp Frontend (`pg_general_1.js` & `pg_general_3.html`) để hiển thị Modal chọn bảng in và render template HTML in với tiêu đề mới.
  - Phase 3: Kiểm thử toàn bộ luồng in ở các cơ sở.

## 9. Test Strategy

- **Automated tests:** Chạy thử hàm GAS trong `doGet_tongHopCk.js` với Logger để kiểm tra danh sách trả về.
- **Manual verification:**
  1. Chọn Phú Thọ -> Click In -> Kiểm tra Modal 2 nút có xuất hiện không.
  2. Click "In bảng chuyển khoản" -> Kiểm tra cửa sổ in ra tiêu đề cũ & danh sách không có người đi NN.
  3. Click "In bảng treo lương" -> Kiểm tra cửa sổ in ra tiêu đề `DANH SÁCH TREO CHƯA CHI TRẢ TIỀN LƯƠNG` & chỉ gồm người đi NN.
  4. Chọn cơ sở khác (Hà Nội, All) -> Click In -> Kiểm tra in trực tiếp, không hiện Modal.

## 10. Rollback Plan

- Nếu có sự cố, revert lại logic click nút In trong `client/pg_general_3.html` và loại bỏ tham số `isTreoLuong` trong backend.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
