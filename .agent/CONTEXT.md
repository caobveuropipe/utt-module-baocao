# Dikhobac - Context for AI Assistants

---

## 1. Project Overview

- **Tên dự án**: Dikhobac — Hệ thống Bảng Kê & Báo Cáo Kho Bạc
- **Repo**: ⚠️ Chưa có Git Remote (hiện tại quản lý local & cloud qua `clasp`)
- **Trạng thái**: Production — Đang vận hành và tinh chỉnh báo cáo

### Tech Stack
- **Platform**: Google Apps Script (GAS) — Runtime V8
- **Frontend**: HTML + CSS + JavaScript (phục vụ qua `HtmlService`)
- **Backend**: Google Apps Script — `doGet` (API read & export)
- **Database**: Google Sheets (truy xuất qua SpreadsheetApp & Sheets API v4)
- **Shared Library**: `LibraryDigiCore` (development mode)
- **Deployment**: `clasp` CLI + PowerShell scripts (`deploy-all.ps1`, `pull-all.ps1`, `push-all.ps1`)

### Cấu trúc Module

```text
Dikhobac/
├── doGet/              ← API chính & Xử lý báo cáo (Core Logic)
│   ├── Code.js              # Entry point & Routing (doGet)
│   ├── doGet_function.js    # Utility & Helper functions
│   ├── doGet_tongHopLuong.js # Bảng tổng hợp lương chi tiết
│   ├── doGet_tongHopBaoHiem.js # Tổng hợp BHXH, BHYT, BHTN
│   ├── doGet_tongHopKPCD.js # Kinh phí công đoàn
│   ├── doGet_tongHopCk.js   # Tổng hợp chuyển khoản ngân hàng
│   └── ...                  # Các file hạch toán & tổng hợp khác
│
├── client/             ← Giao diện Web (Project Proxy)
│   ├── pg_general_4.html    # Trang quản trị chính hiện tại
│   ├── pg_general_1.js      # Logic điều phối client-side
│   └── styleCss.html        # CSS framework nội bộ
│
├── ThuyetMinhL1/       ← Module Thuyết minh Lương 1 (Instance)
│   ├── modal_dataluong_3.html # UI quản trị thuyết minh lương
│   └── modal_dataluong_1.js   # Logic xử lý modal lương
│
├── ThuyetMinhL2/       ← Module Thuyết minh Lương 2 (Instance)
│
├── backup/             ← Bản sao lưu local (timestamped)
├── .agent/             ← Tài liệu quản trị tri thức cho AI
└── *.ps1               ← Scripts hỗ trợ deploy/sync
```

---

## 2. 📂 .agent/ Directory Navigation

| File | Mô tả |
|------|--------|
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Snapshot cấu trúc thực tế |
| [KNOWLEDGE_BASE.md](./KNOWLEDGE_BASE.md) | Quyết định kiến trúc & "Tại sao làm thế?" |
| [architecture/MASTER.md](./architecture/MASTER.md) | Kiến trúc tổng thể hệ thống |

---

## 3. ⚙️ Routing & Logic (doGet)

Hàm `doGet(e)` trong `doGet/Code.js` điều hướng dựa trên tham số `type`:

| Tham số `type` | Chức năng (Handler) |
| :--- | :--- |
| `taoBangTongHopLuong` | Tổng hợp bảng lương (Vĩnh Phúc/Hà Nội) |
| `taoBangTongHopBaoHiem` | Tổng hợp BHXH/YT/TN |
| `taoBangTongHopKhoanTru` | Tổng hợp các khoản trừ qua lương |
| `taoBangTongHopKPCD` | Tổng hợp kinh phí công đoàn (x2 hệ số) |
| `tongHopCk` | Tổng hợp chuyển khoản đi ngân hàng |

---

## 4. 🖥️ UI Workflow (Client)

1. **Khởi tạo**: `functionInit` gọi `pg1_ed1_getAllData` để lấy danh sách tháng và hằng số.
2. **Phân quyền**: Kiểm tra quyền `Tính lương-Xem` trước khi hiển thị dữ liệu.
3. **Logic Xuất**:
   - Người dùng chọn tháng -> Click module -> Gọi API `doGet`.
   - Kết quả trả về `downloadUrl` (file Excel/PDF) -> Mở link trong tab mới.

---

## 5. Quick Commands

```powershell
# Sync code từ cloud về local
.\pull-all.ps1

# Đẩy code lên cloud
.\push-all.ps1

# Deploy (tạo version mới)
.\deploy-all.ps1
```

*Last updated: 2026-04-19 | Cấu trúc chuẩn hóa bởi Antigravity*
