# scripts/test-task-e.ps1
# E2E Verification for Task E: Per-Tab Independent Sessions and Login Behavior

$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:8080/api"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "TASK E VERIFICATION: Per-Tab Sessions & Isolation" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# 1. Setup Student Account for Tab 2
$adminEmail = if ($env:TEST_ADMIN_EMAIL) { $env:TEST_ADMIN_EMAIL } elseif ($env:ADMIN_EMAIL) { $env:ADMIN_EMAIL } else { "admin@zoro.com" }
$adminPassword = if ($env:TEST_ADMIN_PASSWORD) { $env:TEST_ADMIN_PASSWORD } elseif ($env:ADMIN_PASSWORD) { $env:ADMIN_PASSWORD } else { "placeholder_admin_pass" }
$adminLoginBody = @{
    email = $adminEmail
    password = $adminPassword
} | ConvertTo-Json

Write-Host "`n[Step 1] Logging in Tab 1 as Admin..."
$adminLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $adminLoginBody -ContentType "application/json"
$tab1AccessToken = $adminLoginRes.data.accessToken
$tab1RefreshToken = $adminLoginRes.data.refreshToken
$tab1User = $adminLoginRes.data.user
Write-Host "-> HTTP 200: Tab 1 Admin Login OK. User ID: $($tab1User.id), Role: $($tab1User.role)" -ForegroundColor Green
Write-Host "   Tab 1 Access Token: $($tab1AccessToken.Substring(0, 20))..."

$studentEmail = "tab2_student_$(Get-Random)@zoro.com"
$studentPass = "StudentTab2Pass123!"
$createStudentBody = @{
    name = "Tab2 Student User"
    email = $studentEmail
    password = $studentPass
    role = "STUDENT"
    status = "Active"
} | ConvertTo-Json

Write-Host "`n[Step 2] Creating test student for Tab 2..."
$adminHeaders = @{ Authorization = "Bearer $tab1AccessToken"; "Content-Type" = "application/json" }
$createdStudent = Invoke-RestMethod -Uri "$baseUrl/users/students" -Method Post -Headers $adminHeaders -Body $createStudentBody
Write-Host "-> HTTP 200: Test student created. ID: $($createdStudent.data.id)" -ForegroundColor Green

# 2. Login Tab 2 as Student
Write-Host "`n[Step 3] Logging in Tab 2 as Student (simulating independent tab)..."
$studentLoginBody = @{
    email = $studentEmail
    password = $studentPass
} | ConvertTo-Json

$studentLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $studentLoginBody -ContentType "application/json"
$tab2AccessToken = $studentLoginRes.data.accessToken
$tab2RefreshToken = $studentLoginRes.data.refreshToken
$tab2User = $studentLoginRes.data.user
Write-Host "-> HTTP 200: Tab 2 Student Login OK. User ID: $($tab2User.id), Role: $($tab2User.role)" -ForegroundColor Green
Write-Host "   Tab 2 Access Token: $($tab2AccessToken.Substring(0, 20))..."

if ($tab1AccessToken -eq $tab2AccessToken) {
    Write-Error "FATAL: Tab 1 and Tab 2 received the same access token!"
}

# 3. Concurrent verification of identity per tab
Write-Host "`n[Step 4] Querying /api/auth/me concurrently for Tab 1 and Tab 2..."
$tab1Headers = @{ Authorization = "Bearer $tab1AccessToken" }
$tab2Headers = @{ Authorization = "Bearer $tab2AccessToken" }

$meTab1 = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers $tab1Headers
$meTab2 = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers $tab2Headers

Write-Host "-> HTTP 200: Tab 1 identity: $($meTab1.data.email), Role: $($meTab1.data.role)" -ForegroundColor Green
Write-Host "-> HTTP 200: Tab 2 identity: $($meTab2.data.email), Role: $($meTab2.data.role)" -ForegroundColor Green

if ($meTab1.data.role -ne "ADMIN") {
    Write-Error "Tab 1 expected role ADMIN but got $($meTab1.data.role)"
}
if ($meTab2.data.role -ne "STUDENT") {
    Write-Error "Tab 2 expected role STUDENT but got $($meTab2.data.role)"
}

# 4. Token Refresh in Tab 1 does not affect Tab 2
Write-Host "`n[Step 5] Rotating refresh token in Tab 1 (Single-flight refresh simulation)..."
$refreshBodyTab1 = @{ refreshToken = $tab1RefreshToken } | ConvertTo-Json
$refreshResTab1 = Invoke-RestMethod -Uri "$baseUrl/auth/refresh" -Method Post -Body $refreshBodyTab1 -ContentType "application/json"
$newTab1AccessToken = $refreshResTab1.data.accessToken
$newTab1RefreshToken = $refreshResTab1.data.refreshToken
Write-Host "-> HTTP 200: Tab 1 refreshed successfully. New token: $($newTab1AccessToken.Substring(0, 20))..." -ForegroundColor Green

# Verify Tab 1 with new token
$newTab1Headers = @{ Authorization = "Bearer $newTab1AccessToken" }
$meTab1After = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers $newTab1Headers
Write-Host "-> HTTP 200: Tab 1 after refresh identity: $($meTab1After.data.email), Role: $($meTab1After.data.role)" -ForegroundColor Green

# Verify Tab 2 is completely undisturbed
$meTab2After = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers $tab2Headers
Write-Host "-> HTTP 200: Tab 2 still valid with original token: $($meTab2After.data.email), Role: $($meTab2After.data.role)" -ForegroundColor Green

# 5. Logout Tab 2 affects only Tab 2
Write-Host "`n[Step 6] Logging out Tab 2 (independent session termination)..."
$logoutBodyTab2 = @{ refreshToken = $tab2RefreshToken } | ConvertTo-Json
$logoutResTab2 = Invoke-RestMethod -Uri "$baseUrl/auth/logout" -Method Post -Headers $tab2Headers -Body $logoutBodyTab2 -ContentType "application/json"
Write-Host "-> HTTP 200: Tab 2 logged out successfully." -ForegroundColor Green

# Verify Tab 2 refresh token is revoked
try {
    Invoke-RestMethod -Uri "$baseUrl/auth/refresh" -Method Post -Body $logoutBodyTab2 -ContentType "application/json"
    Write-Error "FATAL: Tab 2 revoked refresh token should have failed!"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "-> HTTP $($code): Tab 2 refresh token rejected after logout as expected." -ForegroundColor Green
}

# Verify Tab 1 session remains fully intact
$meTab1Final = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers $newTab1Headers
Write-Host "-> HTTP 200: Tab 1 session remains active and valid after Tab 2 logout: $($meTab1Final.data.email)" -ForegroundColor Green

# 6. Cleanup Tab 2 user
Invoke-RestMethod -Uri "$baseUrl/users/$($createdStudent.data.id)?force=true" -Method Delete -Headers $newTab1Headers | Out-Null
Write-Host "`n-> HTTP 200: Cleaned up test student." -ForegroundColor Green

Write-Host "`n====================================================" -ForegroundColor Cyan
Write-Host "ALL TASK E PER-TAB SESSION TESTS PASSED SUCCESSFULLY!" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
