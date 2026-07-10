# Feature Plan: Hệ thống Đa Báo cáo & Danh mục Báo cáo

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: [User bỏ qua review với rủi ro đã nêu]
> **Feature slug**: multi-report-system
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-04-13

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Tài liệu nghiệp vụ `Bao cao chi Le Thuy.txt` yêu cầu 5 loại báo cáo riêng biệt với các quy tắc tính toán khác nhau, nhưng hiện tại hệ thống chỉ hỗ trợ 1 loại duy nhất ("Doanh thu thực hiện").
- **Vấn đề cần giải quyết:** Thiếu các loại báo cáo quan trọng (Bán mới, Bán lại, Phụ BS, Doanh số giới thiệu) và thiếu giao diện quản lý danh mục báo cáo.
- **Mục tiêu:** Xây dựng hệ thống báo cáo đa dạng, chính xác theo đúng logic nghiệp vụ đã cam kết và chuẩn hóa giao diện lựa chọn báo cáo.
- **Kết quả mong đợi:** Người dùng có thể chọn 1 trong 5 loại báo cáo từ Dashboard, xem dữ liệu tương ứng đã được tính toán theo đúng công thức nghiệp vụ.

## 2. Phạm vi

### In scope
- Cập nhật UI `client/index.html`: Thêm 4 loại báo cáo vào dropdown "Loại báo cáo".
- Cập nhật UI `client/scripts.html`: Xử lý gửi request và hiển thị kết quả cho từng loại báo cáo.
- Cập nhật Backend `doget/Service_Report_Engine.gs`: Triển khai 4 hàm tính toán mới (2.2 đến 2.5).
- Cập nhật Backend `doget/doGet.gs`: Mở rộng routing để nhận diện tham số `reportType`.
- Phân tách logic lọc dữ liệu (Sản phẩm vs Dịch vụ, Khách mới vs Khách cũ).

### Out of scope
- Hệ thống quản lý danh mục dịch vụ (Master Data) nâng nâng cao (sẽ để ở một feature riêng). Giai đoạn này dùng JSON/Cấu hình cứng trong code hoặc placeholder.
- Xuất file Excel/PDF cho từng loại báo cáo (vẫn giữ template chung nếu có thể).

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** 
  - [2026-04-13] Cấu trúc phân bổ doanh thu đa tầng (BS:Sale 7:3, BS:DD 5:5).
  - Tách biệt dữ liệu gốc và Logic xử lý.
- **"Cấm kỵ" cần tránh:** Không làm thay đổi định dạng dữ liệu trong file Excel đầu vào.
- **Ràng buộc kiến trúc liên quan:** Phải tuân thủ mô hình 3-project (client, doget, dopost) và giao tiếp qua Proxy.

## 4. Giả định và câu hỏi mở

### Giả định
- "Danh mục dịch vụ của bác sĩ" (dùng cho báo cáo 2.1 và 2.4) hiện tại sẽ được giả định là các dịch vụ có đơn giá cao hoặc có tên cụ thể (sẽ liệt kê trong code).
- Định nghĩa "Sản phẩm" vs "Dịch vụ" dựa trên cột "Dịch vụ & Sản phẩm" trong Excel.

### Câu hỏi mở
- [Non-blocking] Các báo cáo 2.2 đến 2.5 có cần thêm các cột hiển thị đặc thù không, hay giữ nguyên grid hiện tại?
- [Non-blocking] Phương thức nhận diện "NV tư vấn" và "NV bán hàng" trong Excel có fix cứng cột hay không?

## 5. Acceptance Criteria

- [ ] Dropdown "Loại báo cáo" hiển thị đủ 5 tùy chọn.
- [ ] Báo cáo 2.2 (Bán mới) tính đúng doanh thu cho NV Bán hàng (bao gồm Khám/Tái khám).
- [ ] Báo cáo 2.3 (Bán lại) chỉ tính cho "Sản phẩm" và đúng NV Tư vấn.
- [ ] Báo cáo 2.4 (Phụ BS) loại trừ bộ phận Bác sĩ và chỉ tính theo danh mục.
- [ ] Báo cáo 2.5 (Giới thiệu) tính đúng doanh số tổng cho người giới thiệu.
- [ ] Phản hồi UI mượt mà khi chuyển đổi giữa các loại báo cáo.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `client/index.html` | Sửa | Cập nhật UI dropdown | 🟢 | Có |
| `client/scripts.html` | Sửa | Xử lý logic gọi API report | 🟡 | Có |
| `doget/doGet.gs` | Sửa | Routing tham số `reportType` | 🟢 | Có |
| `doget/Service_Report_Engine.gs` | Sửa | Triển khai logic tính toán 4 báo cáo mới | 🔴 | Có |
| `architecture/MASTER.md` | Sửa | Cập nhật trạng thái triển khai logic | 🟢 | Không |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Logic tính toán trong `Service_Report_Engine.gs` (đặc biệt là việc lọc sản phẩm/dịch vụ và phân bổ người thực hiện).
- **Review focus areas:** 
  - Mối quan hệ giữa report logic và master data (làm sao để không hard-code danh mục dịch vụ quá nhiều).
  - Hiệu năng khi duyệt qua hàng ngàn dòng data Excel để lọc theo nhiều điều kiện.
- **Known pitfalls / historical issues:** Trùng lặp doanh thu nếu logic phân bổ không xử lý kỹ phần `multiplier`.
- **Dependencies / rollout concerns:** Cần đảm bảo file Excel đầu vào có đủ các cột: "Nhân viên bán", "Nhân viên tư vấn", "Người giới thiệu".

## 8. Chiến lược triển khai

- **Phase strategy:** 2 Phase
  - **Phase 1: UI & Routing**: Cập nhật giao diện và luồng truyền nhận tham số reportType.
  - **Phase 2: Core Logic**: Triển khai các hàm tính toán báo cáo 2.2 -> 2.5.
- **Thứ tự triển khai:** UI -> Routing -> Core Logic.
- **Điểm cần phối hợp:** Kiểm tra định dạng cột trong file Excel mẫu để đảm bảo script đọc đúng cột NV Bán, NV Tư vấn.

## 9. Test Strategy

- **Manual verification:** 
  - Test lọc từng loại báo cáo trên cùng một bộ data mẫu.
  - So sánh kết quả tính tay (Excel) with kết quả hệ thống cho 1-2 ca điển hình.
- **Data chuẩn bị:** File Excel có đầy đủ dữ liệu test cho cả KH mới, KH cũ, mua sản phẩm và dịch vụ BS.

## 10. Rollback Plan

- Khôi phục phiên bản `Service_Report_Engine.gs` gần nhất (hệ thống chỉ có 1 báo cáo).

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
