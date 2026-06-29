# Pull all scripts from Google Apps Script
$modules = @("doGet", "client")

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PULLING ALL MODULES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$i = 1
foreach ($module in $modules) {
    Write-Host "[PULL $i/$($modules.Count)] Pulling $module..." -ForegroundColor Yellow
    if (Test-Path $module) {
        Push-Location $module
        try {
            clasp pull
            Write-Host "OK $module pulled successfully!" -ForegroundColor Green
        } catch {
            Write-Host "ERROR pulling $module" -ForegroundColor Red
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
Write-Host "ALL PULLS COMPLETED!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

