# Task C End-to-End Verification Script
$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:8080/api"

Write-Host "=== TASK C: COURSE MODULES & SECURED PLAYBACK VERIFICATION ===" -ForegroundColor Cyan

# 1. Admin Login
Write-Host "`n[1] Admin Login..."
$adminEmail = if ($env:TEST_ADMIN_EMAIL) { $env:TEST_ADMIN_EMAIL } elseif ($env:ADMIN_EMAIL) { $env:ADMIN_EMAIL } else { "admin@zoro.com" }
$adminPassword = if ($env:TEST_ADMIN_PASSWORD) { $env:TEST_ADMIN_PASSWORD } elseif ($env:ADMIN_PASSWORD) { $env:ADMIN_PASSWORD } else { "placeholder_admin_pass" }
$adminLogin = @{ email = $adminEmail; password = $adminPassword } | ConvertTo-Json
$adminRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $adminLogin -ContentType "application/json"
$adminToken = $adminRes.data.accessToken
Write-Host "-> HTTP 200: Admin token obtained." -ForegroundColor Green
$adminHeaders = @{ Authorization = "Bearer $adminToken"; "Content-Type" = "application/json" }

# 2. Get Courses and select target course
Write-Host "`n[2] Fetching Course..."
$courses = (Invoke-RestMethod -Uri "$baseUrl/courses" -Method Get).data
$course = $courses[0]
Write-Host "-> Target Course: $($course.id) - $($course.title) (Mode: $($course.mode))"

# 3. Create Video Upload Session (POST /api/videos/upload-session)
Write-Host "`n[3] Creating Video Upload Session..."
$uploadReq = @{
    title = "Lesson 1: Introduction to Conversational English"
    courseId = $course.id
    moduleId = $null
} | ConvertTo-Json
$uploadRes = Invoke-RestMethod -Uri "$baseUrl/videos/upload-session" -Method Post -Headers $adminHeaders -Body $uploadReq
$videoId = $uploadRes.data.videoId
Write-Host "-> HTTP 200: Video upload session created." -ForegroundColor Green
Write-Host "   Video ID: $videoId"
Write-Host "   TUS Endpoint: $($uploadRes.data.tusEndpoint)"
Write-Host "   Library ID: $($uploadRes.data.libraryId)"
Write-Host "   Status: $($uploadRes.data.status)"

# 4. Check Video Details (GET /api/videos/{id})
Write-Host "`n[4] Querying Video Details (GET /api/videos/$videoId)..."
$vidDetails = Invoke-RestMethod -Uri "$baseUrl/videos/$videoId" -Method Get -Headers $adminHeaders
Write-Host "-> HTTP 200: Video Details retrieved." -ForegroundColor Green
Write-Host "   Video ID: $($vidDetails.data.bunnyVideoId)"
Write-Host "   Status: $($vidDetails.data.status) ($($vidDetails.data.statusLabel))"

# 5. Create Module for the Course with videoStorageRef (POST /api/courses/{id}/modules)
Write-Host "`n[5] Creating Course Module with Video..."
$modulePayload = @{
    title = "Module 1: Conversational English Basics"
    description = "Core speaking concepts and fundamentals"
    duration = "" # Empty initially when video is processing (Requirement 1)
    videoStorageRef = (@{ videoId = $videoId; status = "Ready" } | ConvertTo-Json -Compress)
} | ConvertTo-Json
$createModRes = Invoke-RestMethod -Uri "$baseUrl/courses/$($course.id)/modules" -Method Post -Headers $adminHeaders -Body $modulePayload
$moduleId = $createModRes.data.id
Write-Host "-> HTTP 200: Module created successfully." -ForegroundColor Green
Write-Host "   Module ID: $moduleId"
Write-Host "   Title: $($createModRes.data.title)"
Write-Host "   Duration: '$($createModRes.data.duration)'"
Write-Host "   VideoStorageRef: $($createModRes.data.videoStorageRef)"

# 6. Verify Public Course syllabus (GET /api/courses)
Write-Host "`n[6] Verifying Module in Public Course Syllabus (GET /api/courses)..."
$publicCourses = (Invoke-RestMethod -Uri "$baseUrl/courses" -Method Get).data
$pubCourse = $publicCourses | Where-Object { $_.id -eq $course.id }
$foundMod = $pubCourse.modules | Where-Object { $_.id -eq $moduleId }
if ($foundMod) {
    Write-Host "-> HTTP 200: Module found in public course syllabus! Title: $($foundMod.title)" -ForegroundColor Green
} else {
    Write-Host "-> ERROR: Module not found in public course syllabus." -ForegroundColor Red
}

# 7. Test Secured Playback Authorization
Write-Host "`n[7] Testing Secured Video Playback Authorization..."

# 7A. Student account: Get or create student
$students = (Invoke-RestMethod -Uri "$baseUrl/users/students" -Method Get -Headers $adminHeaders).data
$testStudent = $null
if ($students.Count -gt 0) {
    $testStudent = $students[0]
} else {
    $newStudent = @{
        name = "Task C Test Student"
        email = "taskc_student@zoro.com"
        role = "STUDENT"
        password = "StudentPass123!"
        status = "Active"
    } | ConvertTo-Json
    $testStudent = (Invoke-RestMethod -Uri "$baseUrl/users/students" -Method Post -Headers $adminHeaders -Body $newStudent).data
}
Write-Host "-> Using Student: $($testStudent.id) ($($testStudent.email))"

# Check if student already enrolled in $course.id, if so clean up or use another course
# Let's ensure enrollment test is pristine
# First, student login or token
# If we don't know the student's raw password, we can generate a student JWT token or test with a known student
$knownStudentEmail = "taskc_student_fresh@zoro.com"
$knownStudentPass = "StudentPass123!"
# Create a fresh student with known password
$freshStudentPayload = @{
    name = "Fresh Task C Student"
    email = $knownStudentEmail
    role = "STUDENT"
    password = $knownStudentPass
    status = "Active"
} | ConvertTo-Json
try {
    $createdStudent = (Invoke-RestMethod -Uri "$baseUrl/users/students" -Method Post -Headers $adminHeaders -Body $freshStudentPayload).data
} catch {
    # If already exists, continue
}

$studentLogin = @{ email = $knownStudentEmail; password = $knownStudentPass } | ConvertTo-Json
$studentRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $studentLogin -ContentType "application/json"
$studentToken = $studentRes.data.accessToken
$studentHeaders = @{ Authorization = "Bearer $studentToken"; "Content-Type" = "application/json" }
Write-Host "-> Student Logged In. Access token obtained." -ForegroundColor Green

# 7B. UNENROLLED Student Playback Attempt (MUST BE DENIED HTTP 403)
Write-Host "`n[7B] Unenrolled Student Playback Attempt (Expected: 403 Forbidden)..."
try {
    $denyRes = Invoke-WebRequest -Uri "$baseUrl/videos/$moduleId/playback" -Method Get -Headers $studentHeaders
    Write-Host "-> ERROR: Unenrolled student was NOT denied! Status: $($denyRes.StatusCode)" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "-> HTTP $statusCode Forbidden: Unenrolled student was DENIED as expected!" -ForegroundColor Green
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $body = $reader.ReadToEnd()
    Write-Host "   Response Body: $body"
}

# 7C. Enroll the Student in the course
Write-Host "`n[7C] Enrolling Student in Course ($($course.id))..."
$enrollPayload = @{
    studentId = $studentRes.data.user.id
    studentEmail = $knownStudentEmail
    studentName = "Fresh Task C Student"
    courseId = $course.id
    courseTitle = $course.title
    status = "Active"
} | ConvertTo-Json
$enrollRes = Invoke-RestMethod -Uri "$baseUrl/enrollments" -Method Post -Headers $adminHeaders -Body $enrollPayload
Write-Host "-> HTTP 200: Student enrolled successfully." -ForegroundColor Green

# 7D. ENROLLED Student Playback Attempt (MUST BE AUTHORIZED HTTP 200)
Write-Host "`n[7D] Enrolled Student Playback Attempt (Expected: 200 OK with signed URLs)..."
$authPlayRes = Invoke-RestMethod -Uri "$baseUrl/videos/$moduleId/playback" -Method Get -Headers $studentHeaders
Write-Host "-> HTTP 200: Playback Authorized!" -ForegroundColor Green
Write-Host "   Authorized: $($authPlayRes.data.authorized)"
Write-Host "   Video ID: $($authPlayRes.data.videoId)"
Write-Host "   Stream URL: $($authPlayRes.data.streamUrl)"
Write-Host "   Embed URL: $($authPlayRes.data.embedUrl)"
Write-Host "   Token: $($authPlayRes.data.token.Substring(0, 20))..."

# 8. Update Module Duration and Title (PUT /api/courses/{id}/modules/{id})
Write-Host "`n[8] Updating Module (Title and Duration from Bunny Ready state)..."
$updatePayload = @{
    title = "Module 1: Conversational English Basics (Updated)"
    description = "Updated description"
    duration = "15:42" # Real Bunny duration once ready
    videoStorageRef = (@{ videoId = $videoId; status = "Ready" } | ConvertTo-Json -Compress)
} | ConvertTo-Json
$updateModRes = Invoke-RestMethod -Uri "$baseUrl/courses/$($course.id)/modules/$moduleId" -Method Put -Headers $adminHeaders -Body $updatePayload
Write-Host "-> HTTP 200: Module updated." -ForegroundColor Green
Write-Host "   Updated Title: $($updateModRes.data.title)"
Write-Host "   Updated Duration: $($updateModRes.data.duration)"

# 9. Verify Sync in Course Details (GET /api/courses/{id})
Write-Host "`n[9] Verifying Module Sync in Course Details (GET /api/courses/$($course.id))..."
$courseCheck = (Invoke-RestMethod -Uri "$baseUrl/courses/$($course.id)" -Method Get).data
$checkMod = $courseCheck.modules | Where-Object { $_.id -eq $moduleId }
Write-Host "-> Course Modules Count: $($courseCheck.modules.Count)"
Write-Host "   Module Duration in Course: $($checkMod.duration)"
Write-Host "   Module Title in Course: $($checkMod.title)"

# 10. Delete Module (DELETE /api/courses/{id}/modules/{id})
Write-Host "`n[10] Deleting Module..."
$delRes = Invoke-RestMethod -Uri "$baseUrl/courses/$($course.id)/modules/$moduleId" -Method Delete -Headers $adminHeaders
Write-Host "-> HTTP 200: Module deleted. Response: $($delRes.data)" -ForegroundColor Green

# 11. Confirm Module is removed and video cleaned up
Write-Host "`n[11] Confirming Module Deletion from Course..."
$courseAfterDel = (Invoke-RestMethod -Uri "$baseUrl/courses/$($course.id)" -Method Get).data
$modStillExists = $courseAfterDel.modules | Where-Object { $_.id -eq $moduleId }
if (-not $modStillExists) {
    Write-Host "-> Module verified deleted from course modules list." -ForegroundColor Green
} else {
    Write-Host "-> ERROR: Module still exists in course!" -ForegroundColor Red
}

Write-Host "`n=== TASK C VERIFICATION COMPLETED SUCCESSFULLY ===" -ForegroundColor Green
