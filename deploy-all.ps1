# Deploy all scripts with version backup
$modules = @("doGet", "client")

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

# Backup and create versions for each module
$i = 1
foreach ($module in $modules) {
    if (Test-Path $module) {
        Write-Host "[BACKUP $i/$($modules.Count)] Backing up and versioning $module..." -ForegroundColor Yellow
        $moduleBackupDir = Join-Path $backupDir $module
        New-Item -ItemType Directory -Force -Path $moduleBackupDir | Out-Null
        
        # Local backup
        Copy-Item -Path "$module\*.js" -Destination "$moduleBackupDir\" -ErrorAction SilentlyContinue
        Copy-Item -Path "$module\*.gs" -Destination "$moduleBackupDir\" -ErrorAction SilentlyContinue
        Copy-Item -Path "$module\*.html" -Destination "$moduleBackupDir\" -ErrorAction SilentlyContinue
        Copy-Item -Path "$module\appsscript.json" -Destination "$moduleBackupDir\" -ErrorAction SilentlyContinue
        
        # Create Cloud Version
        Push-Location $module
        try {
            clasp version "$versionDesc"
            Write-Host "OK $module backed up and versioned!" -ForegroundColor Green
        } catch {
            Write-Host "ERROR versioning $module" -ForegroundColor Red
        } finally {
            Pop-Location
        }
    } else {
        Write-Host "[BACKUP $i/$($modules.Count)] Skipping $module (directory not found)" -ForegroundColor DarkGray
    }
    Write-Host ""
    $i++
}

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

$i = 1
foreach ($module in $modules) {
    Write-Host "[DEPLOY $i/$($modules.Count)] Deploying $module..." -ForegroundColor Yellow
    $claspJsonPath = Join-Path $module ".clasp.json"
    if (Test-Path $claspJsonPath) {
        try {
            $claspJson = Get-Content $claspJsonPath | ConvertFrom-Json
            $deploymentId = $claspJson.deploymentId
            
            if ($deploymentId) {
                Push-Location $module
                try {
                    clasp deploy -i $deploymentId
                    Write-Host "OK $module deployed successfully!`n" -ForegroundColor Green
                } finally {
                    Pop-Location
                }
            } else {
                Write-Host "ERROR: No deploymentId found in $claspJsonPath" -ForegroundColor Red
            }
        } catch {
            Write-Host "ERROR processing ${module}: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "SKIPPING $module (no .clasp.json found)" -ForegroundColor DarkGray
    }
    $i++
}

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "ALL DEPLOYMENTS COMPLETED!" -ForegroundColor Magenta
Write-Host "Local backup: $backupDir" -ForegroundColor Magenta
Write-Host "Cloud versions created with: $versionDesc" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

