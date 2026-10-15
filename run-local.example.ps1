# Root run-local.example.ps1
# Copy this file to run-local.ps1 and populate with your local values or run backend/run-local.ps1 directly.

Write-Host "Navigating to backend to launch Zoro Academy..." -ForegroundColor Cyan
Set-Location -Path (Join-Path $PSScriptRoot "backend")

if (Test-Path "run-local.ps1") {
    .\run-local.ps1
} else {
    Write-Host "backend/run-local.ps1 not found. Please create backend/run-local.ps1 from backend/run-local.example.ps1." -ForegroundColor Yellow
}
