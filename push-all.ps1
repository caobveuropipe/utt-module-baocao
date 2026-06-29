# Push all scripts with backup
$modules = @("doGet", "client")

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PUSHING ALL MODULES (WITH BACKUP)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create backup folder with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "backup\$timestamp"

Write-Host "[BACKUP] Creating backup before push..." -ForegroundColor Magenta
Write-Host "[BACKUP] Backup folder: $backupDir" -ForegroundColor Magenta
Write-Host ""

# Backup each module
$i = 1
foreach ($module in $modules) {
    if (Test-Path $module) {
        Write-Host "[BACKUP $i/$($modules.Count)] Backing up $module (local)..." -ForegroundColor Yellow
        $moduleBackupDir = Join-Path $backupDir $module
        New-Item -ItemType Directory -Force -Path $moduleBackupDir | Out-Null
        
        Copy-Item -Path "$module\*.js" -Destination "$moduleBackupDir\" -ErrorAction SilentlyContinue
        Copy-Item -Path "$module\*.gs" -Destination "$moduleBackupDir\" -ErrorAction SilentlyContinue
        Copy-Item -Path "$module\*.html" -Destination "$moduleBackupDir\" -ErrorAction SilentlyContinue
        Copy-Item -Path "$module\appsscript.json" -Destination "$moduleBackupDir\" -ErrorAction SilentlyContinue
        Write-Host "OK $module backed up!" -ForegroundColor Green
    } else {
        Write-Host "[BACKUP $i/$($modules.Count)] Skipping $module (directory not found)" -ForegroundColor DarkGray
    }
    $i++
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "BACKUP COMPLETED: $backupDir" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Now push all modules
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "STARTING PUSH..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$i = 1
foreach ($module in $modules) {
    Write-Host "[PUSH $i/$($modules.Count)] Pushing $module..." -ForegroundColor Yellow
    if (Test-Path $module) {
        Push-Location $module
        try {
            clasp push
            Write-Host "OK $module pushed successfully!" -ForegroundColor Green
        } catch {
            Write-Host "ERROR pushing $module" -ForegroundColor Red
        } finally {
            Pop-Location
        }
    } else {
        Write-Host "SKIPPING $module (directory not found)" -ForegroundColor DarkGray
    }
    Write-Host ""
    $i++
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ALL PUSHES COMPLETED!" -ForegroundColor Cyan
Write-Host "Backup saved at: $backupDir" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

