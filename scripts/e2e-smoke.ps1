# E2E Smoke Test against running backend and real PostgreSQL
$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:8080/api"
Write-Host "=== Starting Zoro Academy E2E Smoke Tests ===" -ForegroundColor Cyan

# 1. Admin Login
Write-Host "`n[Step 1] Admin Login..."
$loginBody = @{ email = "admin@zoro.com"; password = "adminPassword123!" } | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginRes.data.accessToken
Write-Host "-> HTTP 200: Logged in successfully. Token length: $($token.Length)" -ForegroundColor Green

$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

# 2. Website Settings Save and Read (Task A & B)
Write-Host "`n[Step 2] Website Settings Save and Read (JSONB)..."
$settingsPayload = @{
    id = "site_settings_default"
    heroHeadline = "Master English & Abacus with Zoro"
    heroSubheadline = "Interactive Online Classes for Children"
    contactEmail = "support@zoro.com"
    contactPhone = "9876543210"
    address = "123 Learning Way, Education Hub"
    bannerAnnouncement = "New Batch Starting Monday"
    settingsJson = @{
        landingPageContent = @{
            heroHeading = "Skills for a Brighter Tomorrow"
            heroDescription = "Interactive live classes tailored for children aged 5 to 16."
        }
        aboutPageContent = @{
            heading = "About Zoro Academy"
            mission = "Empowering every learner with core skills."
        }
    }
} | ConvertTo-Json -Depth 6

$putSettings = Invoke-RestMethod -Uri "$baseUrl/website-settings" -Method Put -Headers $headers -Body $settingsPayload
Write-Host "-> HTTP 200: PUT /website-settings successful. Headline: $($putSettings.data.heroHeadline)" -ForegroundColor Green

$getSettings = Invoke-RestMethod -Uri "$baseUrl/website-settings" -Method Get
Write-Host "-> HTTP 200: GET /website-settings successful. Contact Email: $($getSettings.data.contactEmail)" -ForegroundColor Green

# 3. Course Module with videoStorageRef & afterSessionAssessment (Task A & C)
Write-Host "`n[Step 3] Course Module Save and Read (JSONB)..."
$courses = (Invoke-RestMethod -Uri "$baseUrl/courses" -Method Get).data
$targetCourse = $courses[0]
Write-Host "Target Course: $($targetCourse.id) ($($targetCourse.title))"

$modulePayload = @{
    title = "E2E Smoke Test Module"
    description = "Testing jsonb storage and video reference"
    moduleOrder = 99
    duration = "30 mins"
    videoStorageRef = @{
        provider = "bunny"
        videoId = "smoke_test_vid_123"
        status = "Ready"
        duration = 1800
    }
    afterSessionAssessment = @{
        googleFormUrl = "https://forms.google.com/test-assessment"
        maxScore = 100
    }
} | ConvertTo-Json -Depth 6

$addModule = Invoke-RestMethod -Uri "$baseUrl/courses/$($targetCourse.id)/modules" -Method Post -Headers $headers -Body $modulePayload
Write-Host "-> HTTP 200: POST /courses/{id}/modules successful. Module ID: $($addModule.data.id)" -ForegroundColor Green

# Clean up test module
Invoke-RestMethod -Uri "$baseUrl/courses/$($targetCourse.id)/modules/$($addModule.data.id)" -Method Delete -Headers $headers | Out-Null
Write-Host "-> HTTP 200: DELETE /courses/{id}/modules/{id} cleaned up." -ForegroundColor Green

# 4. Assignment & Submission with Attachment (Task A)
Write-Host "`n[Step 4] Assignment & Submission Save and Read (JSONB)..."
$assignPayload = @{
    title = "E2E Smoke Assignment"
    course = $targetCourse.title
    courseId = $targetCourse.id
    batch = "Batch Smoke"
    dueDate = "2026-12-31"
    description = "Assignment with jsonb attachment"
    attachment = @{
        name = "problem-set.pdf"
        url = "https://cdn.example.com/problem-set.pdf"
        size = 4096
    }
} | ConvertTo-Json -Depth 6

$addAssign = Invoke-RestMethod -Uri "$baseUrl/assignments" -Method Post -Headers $headers -Body $assignPayload
Write-Host "-> HTTP 200: POST /assignments successful. Assignment ID: $($addAssign.data.id)" -ForegroundColor Green

$subPayload = @{
    assignmentId = $addAssign.data.id
    studentEmail = "student@zoro.com"
    studentName = "Smoke Student"
    answerText = "Smoke submission answer"
    attachment = @{
        name = "student-solution.pdf"
        url = "https://cdn.example.com/student-solution.pdf"
        size = 8192
    }
} | ConvertTo-Json -Depth 6

$addSub = Invoke-RestMethod -Uri "$baseUrl/submissions" -Method Post -Headers $headers -Body $subPayload
Write-Host "-> HTTP 200: POST /submissions successful. Submission ID: $($addSub.data.id)" -ForegroundColor Green

Write-Host "`n=== Task A E2E Smoke Tests PASSED ===" -ForegroundColor Green
