---
description: Kiến trúc tổng thể của dự án ThuyetMinhL1
last_updated: 2026-04-12
---

# Dikhobac - Architecture Master

## Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│                    GOOGLE CLOUD                         │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │   CLIENT     │  │   DO_GET     │                     │
│  │  (Script 1)  │  │  (Script 2)  │                     │
│  │              │  │              │                     │
│  │ ● HTML/CSS   │  │ ● doGet()    │                     │
│  │ ● JavaScript │  │ ● Read APIs  │                     │
│  │ ● UI Modals  │  │ ● Export     │                     │
│  │              │  │   Templates  │                     │
│  └──────┬───────┘  └──────┬───────┘                     │
│         │                 │                             │
│         │    ┌────────────┴──────────────┐              │
│         │    │     LibraryDigiCore       │              │
│         │    │   (Shared Library - dev)  │              │
│         │    └────────────┬──────────────┘              │
│         │                 │                             │
│         └────────────┐    │    ┌────────────────────────┘
│                      ▼    ▼    ▼                        │
│              ┌───────────────────────┐                  │
│              │    GOOGLE SHEETS      │                  │
│              │   (Database Layer)    │                  │
│              │                       │                  │
│              │ ● DataLuong           │                  │
│              │ ● DataNhanSu          │                  │
│              │ ● DataChotNSThang     │                  │
│              │ ● Config sheets       │                  │
│              └───────────────────────┘                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   LOCAL (Developer)                      │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  clasp CLI + PowerShell Scripts                  │   │
│  │  ● deploy-all.ps1  (backup + deploy all)         │   │
│  │  ● pull-all.ps1    (pull from GAS)               │   │
│  │  ● push-all.ps1    (push to GAS)                 │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Data Flow

```
User Browser
    │
    ▼
[CLIENT Web App] ──── google.script.run ────►  [DO_GET]
    │                                            │
    │  ◄──── HTML Response / JSON ───────────────┘
    │                                            │
    │                                            ▼
    │                                     [Google Sheets DB]
    │                                            │
    │  ◄──── Rendered Data ──────────────────────┘
    ▼
User sees results
```

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Platform | Google Apps Script (V8 Runtime) |
| Frontend | HTML + CSS + Vanilla JavaScript |
| Backend | `doGet/` — Google Apps Script Web App |
| Database | Google Sheets (Sheets API v4) |
| Shared Logic | `LibraryDigiCore` (GAS Library, dev mode) |
| Auth | Google OAuth (USER_ACCESSING) |
| Deploy | `clasp` CLI |
| Scripting | PowerShell (Windows) |

---

## Deployment

| Environment | Module | Deploy Method |
|-------------|--------|---------------|
| PROD | client | `clasp deploy -i [deploymentId]` |
| PROD | doGet | `clasp deploy -i [deploymentId]` |

**Deploy workflow:**
1. `pull-all.ps1` — Đồng bộ code từ cloud về local
2. Sửa code local
3. `push-all.ps1` — Push code lên cloud (không deploy)
4. `deploy-all.ps1` — Backup local + tạo version + deploy production

---

*Xem [CONTEXT.md](../CONTEXT.md) để quick overview dự án*
