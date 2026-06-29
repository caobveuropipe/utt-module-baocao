# Pull all scripts (doget, dopost, client) from Google Apps Script

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PULLING ALL MODULES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Pull doget
Write-Host "[PULL 1/3] Pulling doget..." -ForegroundColor Yellow
Set-Location doget
clasp pull
Set-Location ..
Write-Host "OK doget pulled successfully!" -ForegroundColor Green
Write-Host ""

# Pull dopost
Write-Host "[PULL 2/3] Pulling dopost..." -ForegroundColor Yellow
Set-Location dopost
clasp pull
Set-Location ..
Write-Host "OK dopost pulled successfully!" -ForegroundColor Green
Write-Host ""

# Pull client
Write-Host "[PULL 3/3] Pulling client..." -ForegroundColor Yellow
Set-Location client
clasp pull
Set-Location ..
Write-Host "OK client pulled successfully!" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ALL PULLS COMPLETED!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
