# Deploy all scripts (doget, dopost, client) with version backup

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "DEPLOYING ALL MODULES (WITH BACKUP)" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta

# Create backup folder with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "backup\$timestamp"
$versionDesc = "Pre-deploy backup - $timestamp"

Write-Host "[BACKUP] Creating backup before deploy..." -ForegroundColor Yellow
Write-Host "[BACKUP] Backup folder: $backupDir" -ForegroundColor Yellow
Write-Host "[BACKUP] Version description: $versionDesc" -ForegroundColor Yellow
Write-Host ""

# Create backup directories
New-Item -ItemType Directory -Force -Path "$backupDir\client" | Out-Null
New-Item -ItemType Directory -Force -Path "$backupDir\doget" | Out-Null
New-Item -ItemType Directory -Force -Path "$backupDir\dopost" | Out-Null

# Backup and create version for doget (backup LOCAL first)
Write-Host "[BACKUP 1/3] Backing up doget (local)..." -ForegroundColor Yellow
Copy-Item -Path "doget\*.js" -Destination "$backupDir\doget\" -ErrorAction SilentlyContinue
Copy-Item -Path "doget\*.gs" -Destination "$backupDir\doget\" -ErrorAction SilentlyContinue
Copy-Item -Path "doget\*.html" -Destination "$backupDir\doget\" -ErrorAction SilentlyContinue
Copy-Item -Path "doget\appsscript.json" -Destination "$backupDir\doget\" -ErrorAction SilentlyContinue
Set-Location doget
clasp version "$versionDesc"
Set-Location ..
Write-Host "OK doget backed up and versioned!" -ForegroundColor Green
Write-Host ""

# Backup and create version for dopost (backup LOCAL first)
Write-Host "[BACKUP 2/3] Backing up dopost (local)..." -ForegroundColor Yellow
Copy-Item -Path "dopost\*.js" -Destination "$backupDir\dopost\" -ErrorAction SilentlyContinue
Copy-Item -Path "dopost\*.gs" -Destination "$backupDir\dopost\" -ErrorAction SilentlyContinue
Copy-Item -Path "dopost\*.html" -Destination "$backupDir\dopost\" -ErrorAction SilentlyContinue
Copy-Item -Path "dopost\appsscript.json" -Destination "$backupDir\dopost\" -ErrorAction SilentlyContinue
Set-Location dopost
clasp version "$versionDesc"
Set-Location ..
Write-Host "OK dopost backed up and versioned!" -ForegroundColor Green
Write-Host ""

# Backup and create version for client (backup LOCAL first)
Write-Host "[BACKUP 3/3] Backing up client (local)..." -ForegroundColor Yellow
Copy-Item -Path "client\*.js" -Destination "$backupDir\client\" -ErrorAction SilentlyContinue
Copy-Item -Path "client\*.gs" -Destination "$backupDir\client\" -ErrorAction SilentlyContinue
Copy-Item -Path "client\*.html" -Destination "$backupDir\client\" -ErrorAction SilentlyContinue
Copy-Item -Path "client\appsscript.json" -Destination "$backupDir\client\" -ErrorAction SilentlyContinue
Set-Location client
clasp version "$versionDesc"
Set-Location ..
Write-Host "OK client backed up and versioned!" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "BACKUP & VERSIONING COMPLETED!" -ForegroundColor Green
Write-Host "Local backup: $backupDir" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Now deploy all modules
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "STARTING DEPLOYMENT..." -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# Deploy doget
Write-Host "[DEPLOY 1/3] Deploying doget..." -ForegroundColor Yellow
$deploymentId = (Get-Content doget\.clasp.json | ConvertFrom-Json).deploymentId
Set-Location doget
clasp deploy -i $deploymentId
Set-Location ..
Write-Host "OK doget deployed successfully!`n" -ForegroundColor Green

# Deploy dopost
Write-Host "[DEPLOY 2/3] Deploying dopost..." -ForegroundColor Yellow
$deploymentId = (Get-Content dopost\.clasp.json | ConvertFrom-Json).deploymentId
Set-Location dopost
clasp deploy -i $deploymentId
Set-Location ..
Write-Host "OK dopost deployed successfully!`n" -ForegroundColor Green

# Deploy client
Write-Host "[DEPLOY 3/3] Deploying client..." -ForegroundColor Yellow
$deploymentId = (Get-Content client\.clasp.json | ConvertFrom-Json).deploymentId
Set-Location client
clasp deploy -i $deploymentId
Set-Location ..
Write-Host "OK client deployed successfully!`n" -ForegroundColor Green

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "ALL DEPLOYMENTS COMPLETED!" -ForegroundColor Magenta
Write-Host "Local backup: $backupDir" -ForegroundColor Magenta
Write-Host "Cloud versions created with: $versionDesc" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
