$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:8080/api"

Write-Host "=== TASK G VERIFICATION SCRIPT ===" -ForegroundColor Cyan

# Step 1: Admin login
Write-Host "Step 1: Admin login..." -NoNewline
$loginBody = @{
    email = "admin@zoro.com"
    password = "adminPassword123!"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/login" -Body $loginBody -ContentType "application/json"
$adminToken = $loginRes.data.accessToken
$headers = @{
    "Authorization" = "Bearer $adminToken"
    "Content-Type" = "application/json"
}
Write-Host " SUCCESS (HTTP 200, Token acquired)" -ForegroundColor Green

# Step 2: Create course
Write-Host "Step 2: Creating test course..." -NoNewline
$uniqueSuffix = [System.Guid]::NewGuid().ToString().Substring(0, 8)
$coursePayload = @{
    title = "Course Task G $uniqueSuffix"
    description = "Course for Task G batch isolation testing"
    price = 12000
    level = "Beginner"
    mode = "Online"
    status = "Active"
} | ConvertTo-Json

$courseRes = Invoke-RestMethod -Method Post -Uri "$baseUrl/courses" -Headers $headers -Body $coursePayload
$courseId = $courseRes.data.id
$courseTitle = $courseRes.data.title
Write-Host " SUCCESS (HTTP 200, CourseId: $courseId)" -ForegroundColor Green

# Step 3: Create two batches b1 and b2 in the same course
Write-Host "Step 3: Creating Batch 1 (b1) and Batch 2 (b2)..." -NoNewline
$b1Payload = @{
    name = "Batch G1 $uniqueSuffix"
    courseId = $courseId
    courseName = $courseTitle
    session = "Morning"
    status = "Active"
    days = "Monday, Wednesday"
} | ConvertTo-Json

$b1Res = Invoke-RestMethod -Method Post -Uri "$baseUrl/batches" -Headers $headers -Body $b1Payload -ContentType "application/json"
$b1Id = $b1Res.data.id
$b1Name = $b1Res.data.name

$b2Payload = @{
    name = "Batch G2 $uniqueSuffix"
    courseId = $courseId
    courseName = $courseTitle
    session = "Evening"
    status = "Active"
    days = "Tuesday, Thursday"
} | ConvertTo-Json

$b2Res = Invoke-RestMethod -Method Post -Uri "$baseUrl/batches" -Headers $headers -Body $b2Payload -ContentType "application/json"
$b2Id = $b2Res.data.id
$b2Name = $b2Res.data.name
Write-Host " SUCCESS (b1: $b1Id [$b1Name], b2: $b2Id [$b2Name])" -ForegroundColor Green

# Step 4: Create student assigned ONLY to b1
Write-Host "Step 4: Creating student assigned ONLY to b1..." -NoNewline
$studentEmail = "std_g_$uniqueSuffix@zoro.com"
$studentPayload = @{
    name = "Student G $uniqueSuffix"
    username = "stdg_$uniqueSuffix"
    email = $studentEmail
    phone = "9876543210"
    password = "StudentGPass1"
    status = "Active"
    course = "$courseTitle ($b1Name)"
    courseBatches = @(
        @{
            course = $courseTitle
            courseId = $courseId
            batch = $b1Name
            batchId = $b1Id
        }
    )
} | ConvertTo-Json -Depth 5

$studentRes = Invoke-RestMethod -Method Post -Uri "$baseUrl/users/students" -Headers $headers -Body $studentPayload
$studentId = $studentRes.data.id
Write-Host " SUCCESS (HTTP 200, StudentId: $studentId)" -ForegroundColor Green

# Step 5: Query b1 students (Must contain student)
Write-Host "Step 5: Querying GET /api/batches/$b1Id/students..." -NoNewline
$b1StudentsRes = Invoke-RestMethod -Method Get -Uri "$baseUrl/batches/$b1Id/students" -Headers $headers
$b1Students = $b1StudentsRes.data
if ($b1Students.Count -ne 1 -or $b1Students[0].id -ne $studentId) {
    Write-Host " FAILED! Expected student $studentId in b1, got: $($b1Students.Count) students" -ForegroundColor Red
    exit 1
}
Write-Host " SUCCESS (HTTP 200, Student $studentId listed in b1)" -ForegroundColor Green

# Step 6: Query b2 students (Must NOT contain student, ZERO leakage)
Write-Host "Step 6: Querying GET /api/batches/$b2Id/students..." -NoNewline
$b2StudentsRes = Invoke-RestMethod -Method Get -Uri "$baseUrl/batches/$b2Id/students" -Headers $headers
$b2Students = $b2StudentsRes.data
if ($b2Students.Count -ne 0) {
    Write-Host " FAILED! Leakage detected! Student appeared in b2 (count: $($b2Students.Count))" -ForegroundColor Red
    exit 1
}
Write-Host " SUCCESS (HTTP 200, b2 is empty as expected, 0 leakage!)" -ForegroundColor Green

# Step 7: Query b1 student count
Write-Host "Step 7: Querying GET /api/batches/$b1Id/students/count..." -NoNewline
$b1CountRes = Invoke-RestMethod -Method Get -Uri "$baseUrl/batches/$b1Id/students/count" -Headers $headers
if ($b1CountRes.data -ne 1) {
    Write-Host " FAILED! Expected count 1 for b1, got: $($b1CountRes.data)" -ForegroundColor Red
    exit 1
}
Write-Host " SUCCESS (HTTP 200, b1 count = 1)" -ForegroundColor Green

# Step 8: Query b2 student count
Write-Host "Step 8: Querying GET /api/batches/$b2Id/students/count..." -NoNewline
$b2CountRes = Invoke-RestMethod -Method Get -Uri "$baseUrl/batches/$b2Id/students/count" -Headers $headers
if ($b2CountRes.data -ne 0) {
    Write-Host " FAILED! Expected count 0 for b2, got: $($b2CountRes.data)" -ForegroundColor Red
    exit 1
}
Write-Host " SUCCESS (HTTP 200, b2 count = 0)" -ForegroundColor Green

# Step 9: Cleanup
Write-Host "Step 9: Cleaning up test data..." -NoNewline
$delStdRes = Invoke-RestMethod -Method Delete -Uri "$baseUrl/users/$($studentId)?force=true" -Headers $headers
$delB2Res = Invoke-RestMethod -Method Delete -Uri "$baseUrl/batches/$($b2Id)" -Headers $headers
$delB1Res = Invoke-RestMethod -Method Delete -Uri "$baseUrl/batches/$($b1Id)" -Headers $headers
$delCrsRes = Invoke-RestMethod -Method Delete -Uri "$baseUrl/courses/$($courseId)" -Headers $headers
Write-Host " SUCCESS (Cleaned up student, batches, course)" -ForegroundColor Green

Write-Host "ALL TASK G VERIFICATION STEPS PASSED SUCCESSFULLY!" -ForegroundColor Green
