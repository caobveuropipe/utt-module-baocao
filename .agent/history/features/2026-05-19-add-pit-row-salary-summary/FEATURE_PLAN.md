# Feature Plan: Thêm dòng Thuế TNCN vào Bảng tổng hợp lương

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Khuyến nghị gọi `feature-review`
> **Feature slug**: add-pit-row-salary-summary
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-05-19

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Bảng tổng hợp lương hiện tại chưa hiển thị thông tin Thuế TNCN của tháng trước, trong khi dữ liệu này đã được đồng bộ và xử lý trong hệ thống cho bảng Chuyển khoản (đi kho bạc).
- **Vấn đề cần giải quyết:** Cần bổ sung thêm một dòng hiển thị Thuế TNCN (thuế của tháng trước, tương tự như cách lấy dữ liệu của bảng đi kho bạc) và điều chỉnh công thức tính dòng "Cộng" thành `I + II + III - IV` (trong đó IV là Thuế TNCN).
- **Mục tiêu:** Đồng bộ thông tin Thuế TNCN và đảm bảo độ chính xác của tổng số tiền thực nhận sau khi trừ thuế.
- **Kết quả mong đợi:** Bảng tổng hợp lương xuất ra Google Sheets và giao diện in ấn (HTML) hiển thị đúng dòng `IV. THU THUẾ TNCN THÁNG mm/yyyy` và dòng `Cộng: ( I + II + III - IV )` có giá trị chuẩn xác.

## 2. Phạm vi

### In scope
- Cập nhật logic tổng hợp dữ liệu lương trong `doGet/doGet_tongHopLuong.js` để load dữ liệu thuế TNCN từ file `TinhThue`.
- Cập nhật định dạng render trên Google Sheets để tự động in đậm dòng `IV. THU THUẾ TNCN ...`.
- Cập nhật giao diện in ấn trên client ở `client/pg_general_3.html` để đồng bộ dòng Thuế TNCN và công thức dòng Cộng.

### Out of scope
- Thay đổi cấu trúc cơ bản của bảng thuế hay cách tính toán thuế TNCN gốc.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** Sử dụng cấu trúc spreadsheet ID và hàm `getData` dùng chung trong `doGet_function.js`.
- **"Cấm kỵ" cần tránh:** Không hardcode dữ liệu hoặc làm sai lệch danh sách nhân sự của tháng hiện tại. Chỉ lấy thuế TNCN của các nhân sự có mặt trong kỳ lương hiện tại.
- **Ràng buộc kiến trúc liên quan:** Bản in trên client và bản xuất Google Sheets phải khớp tuyệt đối về mặt số liệu.

## 4. Giả định và câu hỏi mở

### Giả định
- Thuế TNCN được lấy từ sheet `TinhThue` của Spreadsheet `1Xcp4cBjKcHWt_FQULd7MrC7fhiX8ZVMzL8wXJ3aoJLw` giống như logic trong `doGet_tongHopCk.js`.
- Kỳ thuế TNCN cần lấy là tháng trước kỳ lương hiện tại (ví dụ: kỳ lương tháng 03/2026 sẽ lấy thuế TNCN của tháng 02/2026).

### Câu hỏi mở
- Không có câu hỏi blocking nào.

## 5. Acceptance Criteria

- [ ] Sheet `THLuong` trên Google Sheets xuất hiện dòng `IV. THU THUẾ TNCN THÁNG mm/yyyy` ngay sau phần ăn ca và trước dòng Cộng.
- [ ] Dòng Cộng hiển thị công thức `Cộng: ( I + II + III - IV )` và giá trị bằng `I + II + III - IV`.
- [ ] Cả bản in HTML (client) và Google Sheets đều tự động in đậm dòng `IV.` và có kẻ đường viền đúng quy chuẩn.
- [ ] Dữ liệu khớp 100% giữa Google Sheets và HTML Print Preview.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `doGet/doGet_tongHopLuong.js` | Sửa | Cập nhật logic tổng hợp dữ liệu, thêm Thuế TNCN và cập nhật dòng Cộng. | 🟡 Cần kiểm tra kỹ logic tính tổng và phân chia địa phương | Chưa |
| `client/pg_general_3.html` | Sửa | Đồng bộ logic hiển thị HTML print và excel export trên giao diện. | 🟢 Rủi ro thấp | Chưa |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Cách tính tổng của dòng Cộng phải trừ đi Thuế TNCN một cách chính xác trên từng địa phương (Hà Nội, Phú Thọ).
- **Review focus areas:** Kiểm tra việc khớp dữ liệu của các nhân sự không có Thuế TNCN (giá trị mặc định là 0).
- **Known pitfalls / historical issues:** Trùng lặp hoặc tính toán sai lệch do nhân sự thay đổi địa phương giữa các tháng.
- **Dependencies / rollout concerns:** Đảm bảo hàm helper `getPrevMonthStr` hoạt động trơn tru.

## 8. Chiến lược triển khai

- **Phase strategy:** Chia làm 2 phase:
  - **Phase 1:** Sửa đổi logic phía server (`doGet/doGet_tongHopLuong.js`) và test xuất Google Sheets.
  - **Phase 2:** Sửa đổi logic phía client (`client/pg_general_3.html`) và test in HTML.
- **Thứ tự triển khai:** Triển khai Server trước, sau đó đồng bộ Client.

## 9. Test Strategy

- **Manual verification:** Thực hiện chạy `doGet_taoBangTongHopLuong("T03.2026")` và đối chiếu trực tiếp dữ liệu xuất ra với file in mẫu.
- **Data / env chuẩn bị trước khi test:** Kỳ lương mẫu T03.2026 đã có sẵn dữ liệu và chốt nhân sự.

## 10. Rollback Plan

- Khôi phục file từ thư mục backup tự động khi chạy deploy-all.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
