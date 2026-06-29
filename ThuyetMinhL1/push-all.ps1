# Push all scripts (doget, dopost, client) with backup

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

# Create backup directories
New-Item -ItemType Directory -Force -Path "$backupDir\client" | Out-Null
New-Item -ItemType Directory -Force -Path "$backupDir\doget" | Out-Null
New-Item -ItemType Directory -Force -Path "$backupDir\dopost" | Out-Null

# Backup doget (backup LOCAL files BEFORE pull)
Write-Host "[BACKUP 1/3] Backing up doget (local)..." -ForegroundColor Yellow
Copy-Item -Path "doget\*.js" -Destination "$backupDir\doget\" -ErrorAction SilentlyContinue
Copy-Item -Path "doget\*.gs" -Destination "$backupDir\doget\" -ErrorAction SilentlyContinue
Copy-Item -Path "doget\*.html" -Destination "$backupDir\doget\" -ErrorAction SilentlyContinue
Copy-Item -Path "doget\appsscript.json" -Destination "$backupDir\doget\" -ErrorAction SilentlyContinue
Write-Host "OK doget backed up!" -ForegroundColor Green
Write-Host ""

# Backup dopost (backup LOCAL files BEFORE push)
Write-Host "[BACKUP 2/3] Backing up dopost (local)..." -ForegroundColor Yellow
Copy-Item -Path "dopost\*.js" -Destination "$backupDir\dopost\" -ErrorAction SilentlyContinue
Copy-Item -Path "dopost\*.gs" -Destination "$backupDir\dopost\" -ErrorAction SilentlyContinue
Copy-Item -Path "dopost\*.html" -Destination "$backupDir\dopost\" -ErrorAction SilentlyContinue
Copy-Item -Path "dopost\appsscript.json" -Destination "$backupDir\dopost\" -ErrorAction SilentlyContinue
Write-Host "OK dopost backed up!" -ForegroundColor Green
Write-Host ""

# Backup client (backup LOCAL files BEFORE push)
Write-Host "[BACKUP 3/3] Backing up client (local)..." -ForegroundColor Yellow
Copy-Item -Path "client\*.js" -Destination "$backupDir\client\" -ErrorAction SilentlyContinue
Copy-Item -Path "client\*.gs" -Destination "$backupDir\client\" -ErrorAction SilentlyContinue
Copy-Item -Path "client\*.html" -Destination "$backupDir\client\" -ErrorAction SilentlyContinue
Copy-Item -Path "client\appsscript.json" -Destination "$backupDir\client\" -ErrorAction SilentlyContinue
Write-Host "OK client backed up!" -ForegroundColor Green
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

# Push doget
Write-Host "[PUSH 1/3] Pushing doget..." -ForegroundColor Yellow
Set-Location doget
clasp push
Set-Location ..
Write-Host "OK doget pushed successfully!" -ForegroundColor Green
Write-Host ""

# Push dopost
Write-Host "[PUSH 2/3] Pushing dopost..." -ForegroundColor Yellow
Set-Location dopost
clasp push
Set-Location ..
Write-Host "OK dopost pushed successfully!" -ForegroundColor Green
Write-Host ""

# Push client
Write-Host "[PUSH 3/3] Pushing client..." -ForegroundColor Yellow
Set-Location client
clasp push
Set-Location ..
Write-Host "OK client pushed successfully!" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ALL PUSHES COMPLETED!" -ForegroundColor Cyan
Write-Host "Backup saved at: $backupDir" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
