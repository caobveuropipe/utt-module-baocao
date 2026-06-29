# Testing Cases - Revenue System

## 1. Authentication & Permissions
| ID | Scenario | Expected Result |
|----|----------|-----------------|
| AUTH-01 | Login với email có trong masterdata | Hiển thị đúng Tên, Role (Doctor/Admin) và ID nhân viên. |
| AUTH-02 | Login với email lạ | Hiển thị thông báo "Email chưa được phân quyền" và chặn truy cập. |

## 2. Excel Import Flow
| ID | Scenario | Expected Result |
|----|----------|-----------------|
| IMP-01 | Upload file Excel 2026 cho DB 2026 | File được convert sang Sheets, dữ liệu được append vào cuối sheet Database năm 2026. |
| IMP-02 | Chọn xóa dữ liệu cũ theo kỳ (01/04 - 15/04) | Dữ liệu cũ trong khoảng thời gian bị xóa trước khi append dữ liệu mới. |
| IMP-03 | File tạm sau khi upload | File .xlsx tạm trong Drive phải được chuyển vào Thùng rác (Trashed). |

## 3. Allocation Logic (Lõi nghiệp vụ)
| ID | Scenario | Expected Result |
|----|----------|-----------------|
| ALOC-01 | 1 BS và 1 Sale tham gia | Doanh thu chia 70% cho BS, 30% cho Sale. |
| ALOC-02 | BS Hà và 2 BS khác | BS Hà nhận 40%, 60% còn lại chia đều cho 2 BS khác (mỗi người 30%). |
| ALOC-03 | Chỉ có BS Hà | BS Hà nhận 100% doanh thu (không áp dụng 4:6 vì không có người chia cùng). |

## 4. Proxy & Integration
| ID | Scenario | Expected Result |
|----|----------|-----------------|
| PROX-01 | Click "Lọc" trong Báo cáo | UI gọi dự án Client -> Client gọi DOGET_URL -> Trả về JSON -> Render bảng. |
| PROX-02 | Thay đổi Năm trên UI | Hệ thống kiểm tra tính sẵn sàng của Spreadsheet ID tương ứng trong Masterdata. |
