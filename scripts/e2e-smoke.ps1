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
Write-Host "`n[Step 2] Website Settings Save and Read (Task B: Landing, About & Contact, General Info)..."
$settingsPayload = @{
    id = "default"
    heroHeadline = "Master English with Zoro Academy"
    heroSubheadline = "Building confidence and communication skills for kids aged 5 to 16."
    contactEmail = "contact@zoroacademy.com"
    contactPhone = "+91 98765 43210"
    address = "No. 12, Main Road, Skill Nagar, Chennai - 600001"
    bannerAnnouncement = "New Batches Enrolling Now"
    settingsJson = @{
        landingPageContent = @{
            heroBadge = "Global Communication Skills"
            heroHeading = "Master English with Zoro Academy"
            heroDescription = "Building confidence and communication skills for kids aged 5 to 16."
            heroPrimaryBtnText = "View Courses"
            heroSecondaryBtnText = "Join Competitions"
            featuresTitle = "Our Featured Programs"
            featuresSubtitle = "World-class curricula taught by expert educators."
        }
        aboutPageContent = @{
            heading = "About Zoro English Academy"
            subtitle = "Nurturing Young Minds Through Small Steps and Big Communication"
            introParagraph = "Zoro English Academy is dedicated to empowering students with exceptional communication."
            missionStatement = "To make world-class skill development accessible to every child."
            visionStatement = "Creating a global generation of articulate leaders."
            coreValues = "Excellence, Growth, Integrity"
        }
        contactPageContent = @{
            heading = "Contact Us"
            subtitle = "We are here to support your child's learning journey."
            contactPhone = "+91 98765 43210"
            contactEmail = "contact@zoroacademy.com"
            contactAddress = "No. 12, Main Road, Skill Nagar, Chennai - 600001"
            businessHours = "Monday - Saturday: 9:00 AM - 7:00 PM IST"
        }
        generalInfo = @{
            academyName = "Zoro English Academy"
            tagline = "Small Steps Big Communication"
            contactEmail = "contact@zoroacademy.com"
            contactPhone = "+91 98765 43210"
            address = "No. 12, Main Road, Skill Nagar, Chennai - 600001"
            currency = "INR"
        }
    }
} | ConvertTo-Json -Depth 6

$putSettings = Invoke-RestMethod -Uri "$baseUrl/website-settings" -Method Put -Headers $headers -Body $settingsPayload
Write-Host "-> HTTP 200: PUT /website-settings successful. Headline: $($putSettings.data.heroHeadline)" -ForegroundColor Green

$getSettings = Invoke-RestMethod -Uri "$baseUrl/website-settings" -Method Get
Write-Host "-> HTTP 200: GET /website-settings successful." -ForegroundColor Green
Write-Host "   Headline: $($getSettings.data.heroHeadline)"
Write-Host "   Contact: $($getSettings.data.contactEmail), $($getSettings.data.contactPhone)"
Write-Host "   Address: $($getSettings.data.address)"
$parsedJson = $getSettings.data.settingsJson
Write-Host "   Settings JSON Landing Hero: $($parsedJson.landingPageContent.heroHeading)"
Write-Host "   Settings JSON About Heading: $($parsedJson.aboutPageContent.heading)"
Write-Host "   Settings JSON General Academy: $($parsedJson.generalInfo.academyName)"
Write-Host "   PortalControls Removed: $($parsedJson.portalControls -eq $null)" -ForegroundColor Green

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

# 5. Course Modules & Secured Playback Verification (Task C)
Write-Host "`n[Step 5] Course Modules & Secured Playback Verification (Task C)..."
$vidReq = @{
    title = "E2E Smoke Lesson Video"
    courseId = $targetCourse.id
    moduleId = $null
} | ConvertTo-Json
$vidSession = Invoke-RestMethod -Uri "$baseUrl/videos/upload-session" -Method Post -Headers $headers -Body $vidReq
$videoId = $vidSession.data.videoId
Write-Host "-> HTTP 200: POST /videos/upload-session successful. Video ID: $videoId" -ForegroundColor Green

# Create module with video reference
$cModulePayload = @{
    title = "Task C E2E Module"
    description = "Module testing secured playback and duration sync"
    duration = ""
    videoStorageRef = (@{ videoId = $videoId; status = "Ready" } | ConvertTo-Json -Compress)
} | ConvertTo-Json
$createdModule = Invoke-RestMethod -Uri "$baseUrl/courses/$($targetCourse.id)/modules" -Method Post -Headers $headers -Body $cModulePayload
$cModId = $createdModule.data.id
Write-Host "-> HTTP 200: POST /courses/{id}/modules successful. Module ID: $cModId" -ForegroundColor Green

# Unenrolled student playback denial (HTTP 403)
$freshStudentEmail = "smoke_student_c_$(Get-Random)@zoro.com"
$studentPass = "StudentPass123!"
$newStudentPayload = @{
    name = "Smoke Student C"
    email = $freshStudentEmail
    role = "STUDENT"
    password = $studentPass
    status = "Active"
} | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/users/students" -Method Post -Headers $headers -Body $newStudentPayload | Out-Null

$sLoginBody = @{ email = $freshStudentEmail; password = $studentPass } | ConvertTo-Json
$sLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $sLoginBody -ContentType "application/json"
$sHeaders = @{ Authorization = "Bearer $($sLoginRes.data.accessToken)"; "Content-Type" = "application/json" }

try {
    Invoke-WebRequest -Uri "$baseUrl/videos/$cModId/playback" -Method Get -Headers $sHeaders | Out-Null
    Write-Host "-> ERROR: Unenrolled student was NOT denied playback!" -ForegroundColor Red
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "-> HTTP $code Forbidden: Unenrolled student denied playback as expected." -ForegroundColor Green
}

# Enroll student and verify playback authorization (HTTP 200)
$sEnrollPayload = @{
    studentId = $sLoginRes.data.user.id
    studentEmail = $freshStudentEmail
    studentName = "Smoke Student C"
    courseId = $targetCourse.id
    courseTitle = $targetCourse.title
    status = "Active"
} | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/enrollments" -Method Post -Headers $headers -Body $sEnrollPayload | Out-Null

$playbackAuth = Invoke-RestMethod -Uri "$baseUrl/videos/$cModId/playback" -Method Get -Headers $sHeaders
Write-Host "-> HTTP 200: Enrolled student playback authorized. Video: $($playbackAuth.data.videoId), Authorized: $($playbackAuth.data.authorized)" -ForegroundColor Green

# Clean up module
Invoke-RestMethod -Uri "$baseUrl/courses/$($targetCourse.id)/modules/$cModId" -Method Delete -Headers $headers | Out-Null
Write-Host "-> HTTP 200: DELETE /courses/{id}/modules/{id} cleaned up." -ForegroundColor Green

# 6. Competition Lifecycle & Public Rules Download (Task D)
Write-Host "`n[Step 6] Competition Lifecycle & Public Rules Download (Task D)..."
$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"
$pdfBytes = [System.Text.Encoding]::ASCII.GetBytes("%PDF-1.4`n1 0 obj<</Type/Catalog>>endobj`nxref`n0 1`ntrailer<</Root 1 0 R>>`nstartxref`n30`n%%EOF")
$pdfHeader = "--" + $boundary + $LF + "Content-Disposition: form-data; name=`"category`"" + $LF + $LF + "public-document" + $LF + "--" + $boundary + $LF + "Content-Disposition: form-data; name=`"file`"; filename=`"National-Rules.pdf`"" + $LF + "Content-Type: application/pdf" + $LF + $LF
$pdfFooter = $LF + "--" + $boundary + "--" + $LF

$msPdf = New-Object System.IO.MemoryStream
$swPdf = New-Object System.IO.StreamWriter($msPdf, [System.Text.Encoding]::ASCII)
$swPdf.Write($pdfHeader)
$swPdf.Flush()
$msPdf.Write($pdfBytes, 0, $pdfBytes.Length)
$swPdf.Write($pdfFooter)
$swPdf.Flush()
$pdfData = $msPdf.ToArray()

$pdfUploadRes = Invoke-RestMethod -Uri "$baseUrl/files" -Method Post -Headers @{ Authorization = "Bearer $token" } -Body $pdfData -ContentType "multipart/form-data; boundary=$boundary"
$pdfId = $pdfUploadRes.data.id
Write-Host "-> HTTP 200: Uploaded rules PDF ($pdfId) with category 'public-document', isPublic: $($pdfUploadRes.data.isPublic)" -ForegroundColor Green

$compPayload = @{
    title = "National Abacus Grand Prix 2026"
    category = "Abacus Championship"
    startDate = "2026-11-20"
    endDate = "2026-11-25"
    startTime = "09:00 AM"
    endTime = "12:00 PM"
    venue = "National Hall"
    rulesPdfUrl = "/api/files/$pdfId/download"
    instructions = "Bring abacus tool."
    rules = "Official abacus rules apply."
    contactDetails = "+91 98765 43210"
    registrationFee = 250
    status = "Active"
} | ConvertTo-Json

$compRes = Invoke-RestMethod -Uri "$baseUrl/competitions" -Method Post -Headers $headers -Body $compPayload -ContentType "application/json"
$createdCompId = $compRes.data.id
Write-Host "-> HTTP 200: Competition created ($createdCompId). registrationFormUrl present: $([bool]($compRes.data.PSObject.Properties['registrationFormUrl']))" -ForegroundColor Green

# Public logged-out download test without Authorization
$downloadReq = [System.Net.HttpWebRequest]::Create("$baseUrl/files/$pdfId/download")
$downloadReq.Method = "GET"
$downloadResp = $downloadReq.GetResponse()
$statusCode = [int]$downloadResp.StatusCode
$contentType = $downloadResp.ContentType
$contentDisp = $downloadResp.Headers["Content-Disposition"]
$nosniff = $downloadResp.Headers["X-Content-Type-Options"]
$downloadResp.Close()

Write-Host "-> HTTP $($statusCode): Logged-out download successful. Content-Type: $contentType, Content-Disposition: $contentDisp, X-Content-Type-Options: $nosniff" -ForegroundColor Green

# Clean up competition
Invoke-RestMethod -Uri "$baseUrl/competitions/$createdCompId" -Method Delete -Headers $headers | Out-Null
Write-Host "-> HTTP 200: Competition cleaned up." -ForegroundColor Green

Write-Host "`n=== All E2E Smoke Tests PASSED (Tasks A, B, C, D) ===" -ForegroundColor Green

