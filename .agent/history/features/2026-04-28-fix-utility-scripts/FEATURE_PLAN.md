# Implementation Plan - Fix PowerShell Utility Scripts

The current PowerShell scripts (`push-all.ps1`, `pull-all.ps1`, `deploy-all.ps1`) have several issues:
1. **Directory Drift**: They use `Set-Location ..` which fails if the preceding `Set-Location` failed, moving the terminal to an unexpected parent directory.
2. **Missing Modules**: They reference a `dopost` module that does not exist in the current project structure.
3. **Incomplete Coverage**: They do not include new modules like `ThuyetMinhL1` and `ThuyetMinhL2`.

## Proposed Changes

### 1. Robust Navigation
- Use `Push-Location` and `Pop-Location` instead of `Set-Location ..`.
- Check if a directory exists before attempting to enter it.

### 2. Correct Module List
- Update the list of modules to: `doGet`, `client`, `ThuyetMinhL1`, `ThuyetMinhL2`.

### 3. Error Handling
- Ensure that a failure in one module doesn't cause the entire script to behave unpredictably.

## Task List

- [ ] Modify `push-all.ps1` to use `Push-Location` and correct module list.
- [ ] Modify `pull-all.ps1` to use `Push-Location` and correct module list.
- [ ] Modify `deploy-all.ps1` to use `Push-Location` and correct module list.

## Verification
- Run `.\push-all` and ensure it processes all 4 modules without moving the terminal out of the project root.
- Verify backups are created correctly for all 4 modules.
