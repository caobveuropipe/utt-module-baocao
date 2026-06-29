# Changelog - GAS Revenue Management System

## [1.0.0] - 2026-04-13

### Added
- **SPA Dashboard**: Giao diện đơn trang hiện đại với Sidebar cố định và bộ lọc toàn cục.
- **Role-based Authentication**: Cơ chế xác thực dựa trên Email Google và bảng phân quyền trong Masterdata.
- **Excel Data Management**: Module upload file Excel (.xlsx), tự động convert sang Google Sheets và lưu trữ theo năm.
- **Revenue Allocation Engine**: Thuật toán phân bổ doanh thu đa tầng:
    - Chia giữa các bộ phận: 7:3 (BS:Sale), 5:5 (BS:DD/CSKH).
    - Chia nội bộ: 4:6 (BS Hà : BS Khác).
- **Multi-Project Architecture**: Tách hệ thống thành 3 dự án độc lập (UI, API Read, API Write) liên kết qua cơ chế Proxy API.
- **Automation Scripts**: Bộ công cụ PowerShell (`push-all`, `pull-all`, `deploy-all`) sử dụng `clasp`.

### Fixed
- Lỗi điều hướng Iframe trong môi trường Google Apps Script Web App.
- Lỗi mã hóa JSON khi đồng bộ qua clasp.
- Lỗi hiển thị đa tầng các view nội dung trên dashboard.

### Security
- Giới hạn quyền truy cập dựa trên Email (Mã hóa danh tính qua Masterdata).
- Làm sạch không gian Drive bằng cách tự động xóa file tạm sau khi convert Excel.
