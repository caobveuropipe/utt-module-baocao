# Project Structure - Dikhobac

> Tạo ngày: 2026-04-19
> Cập nhật gần nhất: 2026-04-19
> Mục đích: Lưu snapshot cấu trúc codebase thực thực tế của dự án Dikhobac.

---

## 1. Snapshot cây thư mục (Simplified)

```text
Dikhobac/
|-- .agent/                     # Tài liệu và skills cho AI
|-- client/                     # Project Web UI (Proxy)
|   |-- pg_general_4.html       # Trang quản trị chính
|   |-- pg_general_1.js         # Logic điều phối
|   `-- styleCss.html           # CSS Framework
|-- doGet/                      # Core Logic & API
|   |-- Code.js                 # Entry point & Router
|   |-- doGet_function.js       # Utility functions
|   |-- doGet_tongHopLuong.js    # Logic tổng hợp lương
|   |-- doGet_tongHopBaoHiem.js   # Logic bảo hiểm
|   `-- doGet_tongHopCk.js       # Logic chuyển khoản
|-- ThuyetMinhL1/               # Module Thuyết minh lương 1
|   |-- modal_dataluong_3.html  # UI chính của module
|   `-- modal_dataluong_1.js    # Logic JS của module
|-- ThuyetMinhL2/               # Module Thuyết minh lương 2
|-- backup/                     # Lưu trữ bản sao tự động
|-- deploy-all.ps1              # Script deploy tự động
|-- push-all.ps1                # Script đồng bộ code cloud
`-- pull-all.ps1                # Script kéo code từ cloud
```

## 2. Entry Points

| Loại | File/Path | Vai trò | Ghi chú |
|------|-----------|---------|---------|
| UI | `client/pg_general_4.html` | Điểm truy cập quản trị chính | GAS WebApp |
| UI | `ThuyetMinhL1/modal_dataluong_3.html` | UI quản trị lương L1 | Modal/Page |
| API | `doGet/Code.js` | API Gateway (Read/Export) | Phục vụ tất cả yêu cầu GET |

## 3. Services / Modules chính

| Module/Service | Path | Trách nhiệm |
|----------------|------|-------------|
| Payroll Engine | `doGet/doGet_tongHopLuong.js` | Tính toán và tổng hợp dữ liệu lương |
| Export Manager | `doGet/Code.js` | Tạo file Excel/PDF từ data thô |
| UI Proxy | `client/pg_general_1.js` | Kết nối UI với API của các dự án khác |

## 4. Commands

| Mục đích | Lệnh | Ghi chú |
|----------|------|---------|
| Sync Cloud | `.\push-all.ps1` | Đẩy code lên Google Apps Script |
| Pull Cloud | `.\pull-all.ps1` | Kéo code về local |
| Deploy | `.\deploy-all.ps1` | Tạo phiên bản triển khai mới |

---
*Ghi chú: Cấu trúc này được Antigravity chuẩn hóa lại để thay thế cho bản cũ (PhongKham) bị sai.*
