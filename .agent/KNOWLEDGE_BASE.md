# KNOWLEDGE_BASE.md - Bộ não của dự án ThuyetMinhL1

Lưu trữ những **quyết định kiến trúc** quan trọng và **lịch sử tiến hóa** của dự án.

> ⚠️ **QUY TẮC GHI:**
> - CHỈ ghi quyết định kiến trúc và lý do chiến lược (High-level Decision)
> - TUYỆT ĐỐI TRÁNH liệt kê tính năng (giống Changelog) hoặc mô tả cấu hình (giống Architecture)
> - Mỗi dòng trả lời câu hỏi: "TẠI SAO chúng ta quyết định làm vậy?"
>
> **Ví dụ ĐÚNG:** "Tách doGet/doPost thành 2 Script riêng để tránh conflict khi deploy song song."
> **Ví dụ SAI:** "Thêm cột PC Ngành vào bảng lương." (Đây là Changelog, không phải Knowledge)

---

- [2026-04-12]: Khởi tạo hệ thống quản trị tri thức cho dự án ThuyetMinhL1, áp dụng mô hình Multi Agent Skills.
- [2026-04-12]: Kiến trúc 3-module (client/doGet/doPost) được chọn để tách biệt UI, Read API, và Write API — mỗi module là một Google Apps Script project riêng, deploy độc lập qua `clasp`. Lý do: tránh conflict khi nhiều người cùng làm việc và cho phép scale từng phần.
- [2026-04-12]: Sử dụng `LibraryDigiCore` (shared library, development mode) để chia sẻ logic dùng chung giữa các module. Development mode = true cho phép cập nhật thư viện mà không cần bump version.
- [2026-04-12]: Backup strategy: kết hợp local timestamped backup (PowerShell) + `clasp version` (cloud). Chưa có Git — deploy trực tiếp qua `clasp`.
- [2026-04-19]: Thực hiện chuẩn hóa lại toàn bộ hệ thống tài liệu `.agent/`. Lý do: `PROJECT_STRUCTURE.md` cũ bị sai (mô tả dự án khác), `CONTEXT.md` thiếu các module ThuyetMinhL1/L2. Đã xóa các file `.md` rải rác trong `client/` và `doGet/` để tập trung tri thức vào `.agent/`.
- [2026-06-25]: Quy định tối ưu hiệu năng truy vấn dữ liệu lớn: Bắt buộc sử dụng Sheets Advanced Service (Sheets API v4 - hàm `Sheets.Spreadsheets.Values.get`) thay thế cho phương thức synchronous `SpreadsheetApp` khi cần đọc thông tin quy mô lớn (như file nhân sự `DataNhanSu`, lịch sử lương `DataLuong1`, hoặc chốt nhân sự `DataChotNSThang`) để tránh nghẽn luồng xử lý đồng bộ và lỗi timeout 6 phút của Google Apps Script.

