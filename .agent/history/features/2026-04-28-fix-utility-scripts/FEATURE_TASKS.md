# Feature Tasks - Fix PowerShell Utility Scripts

## Status
- [x] Phase 1: Fix `push-all.ps1`
- [x] Phase 2: Fix `pull-all.ps1`
- [x] Phase 3: Fix `deploy-all.ps1`

## Phase 1: Fix `push-all.ps1`
- [x] Update backup logic to include all 4 modules.
- [x] Update push logic to use `Push-Location` and `Pop-Location`.
- [x] Remove `dopost` and add `ThuyetMinhL1`, `ThuyetMinhL2`.
- [x] Test `push-all.ps1`.

## Phase 2: Fix `pull-all.ps1`
- [x] Update pull logic to use `Push-Location` and `Pop-Location`.
- [x] Remove `dopost` and add `ThuyetMinhL1`, `ThuyetMinhL2`.
- [x] Test `pull-all.ps1`.

## Phase 3: Fix `deploy-all.ps1`
- [x] Update backup/versioning logic to include all 4 modules.
- [x] Update deployment logic to use `Push-Location` and `Pop-Location`.
- [x] Remove `dopost` and add `ThuyetMinhL1`, `ThuyetMinhL2`.
- [x] Test `deploy-all.ps1`.

## Execution Log
- [2026-04-28] Started planning the fix for utility scripts.
- [2026-04-28] Fixed `push-all.ps1`, `pull-all.ps1`, and `deploy-all.ps1`.
- [2026-04-28] Verified `push-all.ps1` successfully processes modules.
- [2026-04-28] Excluded `ThuyetMinhL1` and `ThuyetMinhL2` from all scripts per user request.
