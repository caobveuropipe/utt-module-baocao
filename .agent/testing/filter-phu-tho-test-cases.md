# Test Cases: Lọc nhân sự Phú Thọ có trạng thái khi in bảng đi kho bạc

> **Feature slug**: filter-phu-tho-status-in-kho-bac
> **File bị ảnh hưởng**: `doGet/doGet_tongHopCk.js` → hàm `doGet_tongHopDiNganHang`
> **Ngày tạo**: 2026-06-19
> **Trạng thái**: ✅ Dev test passed

---

## Happy Path

| # | Mô tả | Bước thực hiện | Kết quả mong đợi |
|---|-------|----------------|-------------------|
| HP-01 | In bảng đi kho bạc Phú Thọ — nhân sự có trạng thái bị loại | Chọn Phú Thọ, chọn kỳ lương có nhân sự mang trạng thái (VD: "Đi NN"), bấm In | Nhân sự có trạng thái không xuất hiện trên bản in. Tổng tiền không tính người bị lọc |
| HP-02 | Xuất Excel Phú Thọ — nhân sự có trạng thái bị loại | Chọn Phú Thọ, cùng kỳ lương, bấm Xuất Excel | File tải về không chứa nhân sự có trạng thái. Dòng tổng cộng khớp với danh sách còn lại |
| HP-03 | In/Xuất Hà Nội — không bị ảnh hưởng | Chọn Hà Nội, cùng kỳ lương, bấm In hoặc Xuất Excel | Tất cả nhân sự Hà Nội hiển thị bình thường, kể cả người có trạng thái |
| HP-04 | In/Xuất Tất cả (`All`) — không bị ảnh hưởng | Chọn Tất cả, cùng kỳ lương, bấm In hoặc Xuất Excel | Tất cả nhân sự hiển thị bình thường, bao gồm cả nhân sự Phú Thọ có trạng thái |

## Edge Cases

| # | Mô tả | Bước thực hiện | Kết quả mong đợi |
|---|-------|----------------|-------------------|
| ED-01 | Nhân sự Phú Thọ có trạng thái "Đang làm" | Chọn Phú Thọ, kỳ lương có nhân sự trạng thái "Đang làm" | Nhân sự này KHÔNG bị lọc — vẫn hiển thị bình thường |
| ED-02 | Nhân sự Phú Thọ có cột trạng thái rỗng hoặc chỉ có khoảng trắng | Chọn Phú Thọ, kỳ lương tương ứng | Nhân sự này KHÔNG bị lọc — vẫn hiển thị bình thường |
| ED-03 | Kỳ lương cũ chưa có cột Trạng thái trong DataChotNSThang | Chọn Phú Thọ, chọn kỳ lương cũ | Hệ thống throw lỗi rõ ràng, chặn xuất báo cáo sai lệch |

## Negative Cases

| # | Mô tả | Bước thực hiện | Kết quả mong đợi |
|---|-------|----------------|-------------------|
| NE-01 | Cột Trạng thái bị đổi tên hoặc xóa trong sheet | Đổi tên header cột Trạng thái trong DataChotNSThang, chọn Phú Thọ và bấm In | Hệ thống throw lỗi: "Không tìm thấy cột 'Trạng thái'..." và chặn xuất báo cáo |
| NE-02 | Cột Trạng thái bị đổi tên — chọn Hà Nội hoặc All | Đổi tên header cột, chọn Hà Nội hoặc All | Hệ thống tiếp tục chạy bình thường (không throw), log warning nếu có |

---

*Tạo bởi skill update-docs — 2026-06-19*
