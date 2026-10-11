# test-task-f.ps1 - Automated verification for Task F (Admin-Set AES-256-GCM Reversible Passwords)
$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:8080/api"

# 1. Admin Login
Write-Host "`n1. Admin Login..." -ForegroundColor Cyan
$adminLoginBody = @{ email = "admin@zoro.com"; password = "adminPassword123!" } | ConvertTo-Json
$adminLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $adminLoginBody -ContentType "application/json"
$adminToken = $adminLoginRes.data.accessToken
if (-not $adminToken) { Write-Error "Failed to obtain admin token" }
Write-Host "Admin logged in successfully. Token length: $($adminToken.Length)" -ForegroundColor Green
$adminHeaders = @{ Authorization = "Bearer $adminToken" }

# 2. Create Student with Admin-Set Password
Write-Host "`n2. Create Student with explicit admin-set password 'StudentPass123!'..." -ForegroundColor Cyan
$testEmail = "test.student.taskf@zoroacademy.com"
$testUsername = "teststudentf"
$createStudentBody = @{
    name = "Task F Test Student"
    username = $testUsername
    email = $testEmail
    password = "StudentPass123!"
    phone = "9876543210"
    status = "Active"
    joinedOn = "2026-10-11"
    course = "Spoken English Mastery"
} | ConvertTo-Json

# Delete if already exists from prior run
try {
    $existing = (Invoke-RestMethod -Uri "$baseUrl/users/students" -Method Get -Headers $adminHeaders).data
    $priorUser = ($existing | Where-Object { $_.email -eq $testEmail })
    if ($priorUser) {
        Invoke-RestMethod -Uri "$baseUrl/users/$($priorUser.id)?force=true" -Method Delete -Headers $adminHeaders | Out-Null
    }
} catch {}

$createdStudentRes = Invoke-RestMethod -Uri "$baseUrl/users/students" -Method Post -Body $createStudentBody -ContentType "application/json" -Headers $adminHeaders
$createdStudent = $createdStudentRes.data
$studentId = $createdStudent.id
Write-Host "Created student ID: $studentId (Name: $($createdStudent.name), mustChangePassword: $($createdStudent.mustChangePassword))" -ForegroundColor Green

# 3. Admin Reveals Password via GET /users/{id}/admin-password
Write-Host "`n3. Admin reveals password via GET /users/$studentId/admin-password..." -ForegroundColor Cyan
$pwdRes = (Invoke-RestMethod -Uri "$baseUrl/users/$studentId/admin-password" -Method Get -Headers $adminHeaders).data
if ($pwdRes.password -ne "StudentPass123!") {
    Write-Error "Admin-visible password mismatch! Expected 'StudentPass123!', got '$($pwdRes.password)'"
}
Write-Host "Admin revealed password correctly: $($pwdRes.password)" -ForegroundColor Green

# 4. Student Logs in with Admin-Set Password
Write-Host "`n4. Student logs in with 'StudentPass123!'..." -ForegroundColor Cyan
$studentLoginBody = @{ email = $testEmail; password = "StudentPass123!" } | ConvertTo-Json
$studentLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $studentLoginBody -ContentType "application/json"
$studentToken = $studentLoginRes.data.accessToken
if (-not $studentToken) { Write-Error "Student login failed" }
Write-Host "Student logged in successfully. Token length: $($studentToken.Length)" -ForegroundColor Green
$studentHeaders = @{ Authorization = "Bearer $studentToken" }

# 5. Non-Admin (Student) Attempt to Call GET /users/{id}/admin-password (Must be 403 Forbidden)
Write-Host "`n5. Student calls GET /users/$studentId/admin-password (expecting 403 Forbidden)..." -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$baseUrl/users/$studentId/admin-password" -Method Get -Headers $studentHeaders
    Write-Error "Security failure: student was able to access admin-password endpoint!"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "RBAC confirmed: Student denied with HTTP 403 Forbidden." -ForegroundColor Green
    } else {
        Write-Error "Unexpected status code: $statusCode"
    }
}

# 6. Student Changes Their Own Password via POST /users/password
Write-Host "`n6. Student changes own password to 'StudentNewPass456!'..." -ForegroundColor Cyan
$changePwdBody = @{
    currentPassword = "StudentPass123!"
    newPassword = "StudentNewPass456!"
} | ConvertTo-Json
$changeRes = Invoke-RestMethod -Uri "$baseUrl/users/password" -Method Post -Body $changePwdBody -ContentType "application/json" -Headers $studentHeaders
Write-Host "Password change response: $($changeRes.message)" -ForegroundColor Green

# 7. Admin Reveals Password again (Must reflect new active password!)
Write-Host "`n7. Admin reveals password after student self-service change..." -ForegroundColor Cyan
$pwdRes2 = (Invoke-RestMethod -Uri "$baseUrl/users/$studentId/admin-password" -Method Get -Headers $adminHeaders).data
if ($pwdRes2.password -ne "StudentNewPass456!") {
    Write-Error "Admin-visible password did not sync with student change! Expected 'StudentNewPass456!', got '$($pwdRes2.password)'"
}
Write-Host "Admin revealed updated password correctly: $($pwdRes2.password)" -ForegroundColor Green

# 8. Student Login with Old Password Fails (401)
Write-Host "`n8. Student login with old password 'StudentPass123!' (expecting 401 Unauthorized)..." -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $studentLoginBody -ContentType "application/json"
    Write-Error "Login with old password succeeded unexpectedly!"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400 -or $statusCode -eq 401) {
        Write-Host "Old password rejected with HTTP $statusCode." -ForegroundColor Green
    } else {
        Write-Error "Unexpected status code: $statusCode"
    }
}

# 9. Student Login with New Password Succeeds (200)
Write-Host "`n9. Student login with new password 'StudentNewPass456!'..." -ForegroundColor Cyan
$newLoginBody = @{ email = $testEmail; password = "StudentNewPass456!" } | ConvertTo-Json
$newLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $newLoginBody -ContentType "application/json"
if (-not $newLoginRes.data.accessToken) { Write-Error "Login with new password failed" }
Write-Host "Student logged in successfully with new password." -ForegroundColor Green

# 10. Admin Sets New Password via PUT /users/{id}/admin-password
Write-Host "`n10. Admin sets new password 'AdminOverridePass789!' via PUT /users/$studentId/admin-password..." -ForegroundColor Cyan
$adminSetBody = @{ newPassword = "AdminOverridePass789!" } | ConvertTo-Json
$setRes = Invoke-RestMethod -Uri "$baseUrl/users/$studentId/admin-password" -Method Put -Body $adminSetBody -ContentType "application/json" -Headers $adminHeaders
Write-Host "Admin set password response: $($setRes.message)" -ForegroundColor Green

# 11. Admin Reveals Password again
Write-Host "`n11. Admin reveals password after admin override..." -ForegroundColor Cyan
$pwdRes3 = (Invoke-RestMethod -Uri "$baseUrl/users/$studentId/admin-password" -Method Get -Headers $adminHeaders).data
if ($pwdRes3.password -ne "AdminOverridePass789!") {
    Write-Error "Admin-visible password mismatch after override! Expected 'AdminOverridePass789!', got '$($pwdRes3.password)'"
}
Write-Host "Admin revealed overridden password correctly: $($pwdRes3.password)" -ForegroundColor Green

# 12. Student Logs In with Admin-Overridden Password
Write-Host "`n12. Student logs in with admin-overridden password 'AdminOverridePass789!'..." -ForegroundColor Cyan
$overrideLoginBody = @{ email = $testEmail; password = "AdminOverridePass789!" } | ConvertTo-Json
$overrideLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $overrideLoginBody -ContentType "application/json"
if (-not $overrideLoginRes.data.accessToken) { Write-Error "Login with overridden password failed" }
Write-Host "Student logged in successfully with admin-overridden password." -ForegroundColor Green

# 13. Cleanup
Write-Host "`n13. Cleaning up test student..." -ForegroundColor Cyan
Invoke-RestMethod -Uri "$baseUrl/users/$($studentId)?force=true" -Method Delete -Headers $adminHeaders | Out-Null
Write-Host "Test student cleaned up successfully." -ForegroundColor Green

Write-Host "`n=== TASK F FULL LIFECYCLE VERIFICATION PASSED! ===" -ForegroundColor Green
