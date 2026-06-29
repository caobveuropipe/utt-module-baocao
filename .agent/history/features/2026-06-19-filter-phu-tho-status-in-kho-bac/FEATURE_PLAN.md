# Feature Plan: Lọc nhân sự có trạng thái khi in bảng đi kho bạc Phú Thọ

> **Trạng thái**: ✅ ĐÃ DUYỆT
> **Review gate**: Đã thông qua feature-review thành công. Sẵn sàng thực thi.
> **Feature slug**: filter-phu-tho-status-in-kho-bac
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-06-19


---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Khi in/xuất báo cáo "Bảng đi kho bạc" (Tổng hợp chuyển khoản), người dùng chọn địa phương để lọc và định dạng xuất (In HTML/PDF hoặc Xuất Excel).
- **Vấn đề cần giải quyết:** Hiện tại, khi in bảng đi kho bạc cho cơ sở Phú Thọ, hệ thống vẫn hiển thị tất cả nhân sự thuộc Phú Thọ bất kể trạng thái của họ trong danh sách chốt nhân sự tháng (`DataChotNSThang`). Theo nghiệp vụ mới, những người có bất kỳ trạng thái nào trong bảng `DataChotNSThang` (ví dụ: "Đi NN" hoặc các trạng thái khác) của tháng được chọn sẽ không được đưa lên bản in bảng đi kho bạc cho Phú Thọ.
- **Mục tiêu:** Tự động lọc bỏ các nhân sự có giá trị trong cột `Trạng thái` của sheet `DataChotNSThang` khi kết xuất (in hoặc xuất Excel) bảng đi kho bạc Phú Thọ.
- **Kết quả mong đợi:** Khi người dùng chọn Phú Thọ và click In hoặc Xuất Excel cho bảng đi kho bạc, những nhân viên Phú Thọ có trạng thái trong `DataChotNSThang` sẽ không hiển thị trên danh sách và không được tính vào tổng cộng tiền.

## 2. Phạm vi

### In scope
- Sửa đổi hàm backend `doGet_tongHopDiNganHang` trong [doGet_tongHopCk.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_tongHopCk.js) để:
  - Load thêm cột `Trạng thái` từ sheet `DataChotNSThang` thông qua chỉ mục tự động.
  - Khi tham số `location` là Phú Thọ (sau khi chuẩn hóa thành `'Phú Thọ'`), thực hiện loại bỏ các nhân sự có trường `Trạng thái` khác rỗng.
- Đảm bảo tính toán lại các dòng tổng cộng tiền (`totalAll`, `totals`) trên cả giao diện In (PDF) và Excel xuất ra cho Phú Thọ khớp với danh sách sau khi lọc.

### Out of scope
- Thay đổi logic lọc đối với các địa phương khác (như Hà Nội hoặc "Tất cả địa phương") trừ khi có yêu cầu thêm.
- Thay đổi các báo cáo khác trong nhóm Đi Kho Bạc (như Tổng hợp lương, Tổng hợp bảo hiểm...) do yêu cầu chỉ chỉ rõ "in bảng đi kho bạc".

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** Sử dụng hàm `normalizeLocation` từ [doGet_function.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_function.js) để chuẩn hóa tên địa phương đầu vào một cách an toàn.
- **"Cấm kỵ" cần tránh:** Không hardcode chỉ số cột cố định cho cột `Trạng thái` mà phải dùng hàm `getIdx` để tìm vị trí cột một cách tự động, đề phòng cấu trúc sheet thay đổi.
- **Ràng buộc kiến trúc liên quan:** Mọi chỉnh sửa dữ liệu gốc phải nằm ở backend (`doGet/` module) nhằm đảm bảo cả 2 tính năng (In trực tiếp từ UI gọi `getPrintDataCk` và Xuất Excel gọi `doGet_taoBangTongHopCk`) đều nhận chung một tập dữ liệu đã lọc sạch.

## 4. Giả định và câu hỏi mở

### Giả định
- "Có trạng thái" nghĩa là cột `Trạng thái` trong sheet `DataChotNSThang` có giá trị bất kỳ (sau khi `trim()` không phải chuỗi rỗng `""`).
- Yêu cầu lọc này chỉ áp dụng riêng cho Phú Thọ, không áp dụng cho Hà Nội hoặc All.
- **Tương thích ngược:** Nếu không tìm thấy cột `Trạng thái` trong các sheet dữ liệu tháng cũ, hệ thống sẽ ghi log cảnh báo và tiếp tục chạy mà không lọc bỏ nhân viên nào, thay vì `throw` lỗi làm hỏng báo cáo của các kỳ lịch sử.

### Câu hỏi mở
- *Không có câu hỏi blocking nào.*

## 5. Acceptance Criteria

- [ ] Khi chọn tháng có nhân sự Phú Thọ mang trạng thái (ví dụ: "Đi NN") trong `DataChotNSThang` và bấm in bảng đi kho bạc Phú Thọ, những nhân sự này không xuất hiện trên bản in PDF/HTML.
- [ ] Khi xuất Excel bảng đi kho bạc Phú Thọ, tệp tải về không chứa các nhân sự này và tổng tiền cộng cuối bảng khớp chính xác với tổng số tiền của những người còn lại.
- [ ] Khi in hoặc xuất Excel cho Hà Nội hoặc Tất cả địa phương, các nhân sự có trạng thái vẫn được giữ nguyên (không bị lọc mất) trừ khi họ không thuộc địa phương được chọn.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| [doGet_tongHopCk.js](file:///d:/Project/UoTT/Dikhobac/doGet/doGet_tongHopCk.js) | Sửa | Thêm logic load cột `Trạng thái` từ `DataChotNSThang` và lọc bỏ nhân sự Phú Thọ có trạng thái trong hàm `doGet_tongHopDiNganHang`. | 🟡 Trung bình | Có (Vĩnh Phúc/Hà Nội/Phú Thọ) |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** 
  - Đảm bảo hàm `getIdx` tìm cột `Trạng thái` không bị lỗi do xung đột tên header.
  - **Ràng buộc bất biến (Invariant):** Nếu chọn xuất/in báo cáo cho cơ sở Phú Thọ nhưng không tìm thấy cột `Trạng thái` (`idx7.TrangThai === -1`), hệ thống phải throw lỗi rõ ràng thay vì bỏ qua âm thầm, tránh việc xuất sai dữ liệu thanh toán kho bạc.
- **Review focus areas:** Kiểm tra logic lọc xem có che khuất các nhân viên bình thường không có trạng thái hay không.
- **Known pitfalls / historical issues:** Chú ý việc bỏ tiền tố "CB" ở Mã nhân sự khi hiển thị hoặc đối chiếu.
- **Dependencies / rollout concerns:** Đẩy code lên Cloud qua script `push-all.ps1` để kiểm thử trước trên môi trường Dev URL (`/dev`), tuyệt đối không deploy trực tiếp lên bản chạy chính thức của người dùng.

## 8. Chiến lược triển khai

- **Phase strategy:** 
  - Phase 1: Cập nhật hàm `doGet_tongHopDiNganHang` trong `doGet_tongHopCk.js` để đọc cột `Trạng thái` từ sheet `DataChotNSThang` và lưu vào mapping của nhân sự. Throw lỗi nếu không tìm thấy cột khi truy vấn Phú Thọ.
  - Phase 2: Áp dụng điều kiện lọc Phú Thọ: nếu `locationNormalized === 'Phú Thọ'` và nhân sự có trạng thái khác `'Đang làm'` thì loại bỏ. Ghi log danh sách bị loại bỏ.
  - Phase 3: Đồng bộ lên Cloud bằng `push-all.ps1`, kiểm tra thủ công bản in PDF và file Excel xuất ra trên môi trường Dev URL (`/dev`), nếu hoàn thành tốt mới chạy `deploy-all.ps1` để phát hành bản chính thức.
- **Thứ tự triển khai:** Code backend -> Đồng bộ GAS -> Kiểm tra giao diện Dev URL -> Deploy bản chính thức.

## 9. Test Strategy

- **Manual verification:**
  1. Vào sheet `DataChotNSThang`, tìm một tháng cụ thể (ví dụ: tháng hiện tại hoặc tháng test), thiết lập 1 nhân sự Phú Thọ có cột `Trạng thái` là `"Đi NN"` hoặc `"Thai sản"`.
  2. Bấm In bảng đi kho bạc cho Phú Thọ trên môi trường Dev URL -> Xác minh nhân sự đó không xuất hiện.
  3. Bấm Xuất Excel bảng đi kho bạc cho Phú Thọ trên môi trường Dev URL -> Tải file về và kiểm tra cột dữ liệu cùng dòng tổng cộng xem có chính xác không.
  4. Thử In/Xuất cho Hà Nội -> Đảm bảo nhân viên Hà Nội có trạng thái vẫn hiển thị bình thường.
  5. Thử In/Xuất cho Tất cả địa phương (`All`) -> Xác minh nhân viên Phú Thọ có trạng thái vẫn hiển thị bình thường trong danh sách tổng (không bị lọc mất) và số tiền tổng không bị trừ.
  6. **Giả lập đổi tên cột `Trạng thái` trong sheet chung (Quy trình an toàn):** Đổi tên cột trong thời gian ngắn (hoặc dùng bản copy để test), thực hiện in Phú Thọ -> Xác minh hệ thống báo lỗi rõ ràng và chặn không xuất báo cáo. Sau đó khôi phục lại tên cột gốc ngay lập tức và kiểm tra Phú Thọ lại xuất bình thường.

## 10. Rollback Plan

- Bản sao dự phòng (backup) được lưu cục bộ trong thư mục `backup/` của dự án trước mỗi lần cập nhật. Hoàn tác file `doGet_tongHopCk.js` bằng cách khôi phục bản sao lưu gần nhất.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`

## 12. Review Notes

### FR-01: Sử dụng trim() triệt để khi xác định trạng thái rỗng
- **Nội dung:** Khi trích xuất trạng thái nhân sự từ `DataChotNSThang`, áp dụng `.trim()` để tránh lọc nhầm nhân sự do khoảng trắng vô hình.
- **Trạng thái:** Sẽ thực hiện ở Phase 1.

### FR-02: Thêm log số lượng nhân sự bị loại bỏ
- **Nội dung:** Ghi log chi tiết (Mã nhân sự, Họ tên, Trạng thái) của những người Phú Thọ bị lọc bỏ để hỗ trợ kiểm tra đối chiếu khi cần.
- **Trạng thái:** Sẽ thực hiện ở Phase 2.

### FR-03: Chặn xuất báo cáo Phú Thọ khi thiếu cột Trạng thái (Throw error)
- **Nội dung:** Nếu cột `Trạng thái` không tìm thấy trong sheet chung `DataChotNSThang` (`idx7.TrangThai === -1`) và tham số địa phương được chọn là Phú Thọ, hệ thống PHẢI throw lỗi rõ ràng để chặn xuất dữ liệu sai lệch. Các địa phương khác hoặc `All` có thể cho phép log warning để giữ tương thích ngược.
- **Trạng thái:** Sẽ thực hiện ở Phase 1.

### FR-04: Test trên URL Dev trước khi Deploy Web App chính thức
- **Nội dung:** Sau khi push code lên GAS bằng `clasp push` (hoặc thông qua `push-all.ps1`), thực hiện chạy thử và verify trên môi trường Dev URL (`/dev`) trước khi tiến hành cập nhật bản Deploy chính thức.
- **Trạng thái:** Sẽ thực hiện ở Phase 3.


