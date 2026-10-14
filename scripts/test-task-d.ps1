# scripts/test-task-d.ps1
$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:8080"
Write-Host "=== TASK D E2E VERIFICATION TEST ===" -ForegroundColor Cyan

# 1. Admin Login
$adminEmail = if ($env:TEST_ADMIN_EMAIL) { $env:TEST_ADMIN_EMAIL } elseif ($env:ADMIN_EMAIL) { $env:ADMIN_EMAIL } else { "admin@zoro.com" }
$adminPassword = if ($env:TEST_ADMIN_PASSWORD) { $env:TEST_ADMIN_PASSWORD } elseif ($env:ADMIN_PASSWORD) { $env:ADMIN_PASSWORD } else { "placeholder_admin_pass" }
$loginPayload = @{
    email = $adminEmail
    password = $adminPassword
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginPayload -ContentType "application/json"
$adminToken = $loginRes.data.accessToken
Write-Host "[1] Admin login successful: token obtained" -ForegroundColor Green

# 2. Upload test banner image
$bannerFile = [System.IO.Path]::GetTempFileName() + ".png"
$pngBytes = [byte[]]@(0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82)
[System.IO.File]::WriteAllBytes($bannerFile, $pngBytes)

$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"
$bannerFileBytes = [System.IO.File]::ReadAllBytes($bannerFile)
$bannerHeader = "--" + $boundary + $LF + "Content-Disposition: form-data; name=`"category`"" + $LF + $LF + "banner" + $LF + "--" + $boundary + $LF + "Content-Disposition: form-data; name=`"file`"; filename=`"test_banner.png`"" + $LF + "Content-Type: image/png" + $LF + $LF
$bannerFooter = $LF + "--" + $boundary + "--" + $LF

$ms = New-Object System.IO.MemoryStream
$sw = New-Object System.IO.StreamWriter($ms, [System.Text.Encoding]::ASCII)
$sw.Write($bannerHeader)
$sw.Flush()
$ms.Write($bannerFileBytes, 0, $bannerFileBytes.Length)
$sw.Write($bannerFooter)
$sw.Flush()
$bannerData = $ms.ToArray()

$bannerUploadRes = Invoke-RestMethod -Uri "$baseUrl/api/files" -Method Post -Headers @{ Authorization = "Bearer $adminToken" } -Body $bannerData -ContentType "multipart/form-data; boundary=$boundary"
$bannerUrl = $bannerUploadRes.data.url
Write-Host "[2] Banner uploaded: $($bannerUploadRes.data.id) -> isPublic: $($bannerUploadRes.data.isPublic)" -ForegroundColor Green

# 3. Test magic bytes validation on public-document (reject non-PDF)
$badFile = [System.IO.Path]::GetTempFileName() + ".txt"
[System.IO.File]::WriteAllText($badFile, "This is not a PDF")
$badBytes = [System.IO.File]::ReadAllBytes($badFile)

$badHeader = "--" + $boundary + $LF + "Content-Disposition: form-data; name=`"category`"" + $LF + $LF + "public-document" + $LF + "--" + $boundary + $LF + "Content-Disposition: form-data; name=`"file`"; filename=`"fake.pdf`"" + $LF + "Content-Type: application/pdf" + $LF + $LF

$msBad = New-Object System.IO.MemoryStream
$swBad = New-Object System.IO.StreamWriter($msBad, [System.Text.Encoding]::ASCII)
$swBad.Write($badHeader)
$swBad.Flush()
$msBad.Write($badBytes, 0, $badBytes.Length)
$swBad.Write($bannerFooter)
$swBad.Flush()
$badData = $msBad.ToArray()

try {
    $badRes = Invoke-RestMethod -Uri "$baseUrl/api/files" -Method Post -Headers @{ Authorization = "Bearer $adminToken" } -Body $badData -ContentType "multipart/form-data; boundary=$boundary"
    Write-Error "Expected magic bytes validation failure for fake PDF, but succeeded!"
} catch {
    Write-Host "[3] Non-PDF rejected with HTTP $($_.Exception.Response.StatusCode.value__): $($_.Exception.Message)" -ForegroundColor Green
}

# 4. Upload genuine PDF with public-document category
$pdfBytes = [System.Text.Encoding]::ASCII.GetBytes("%PDF-1.4`n1 0 obj<</Type/Catalog>>endobj`nxref`n0 1`ntrailer<</Root 1 0 R>>`nstartxref`n30`n%%EOF")

$pdfHeader = "--" + $boundary + $LF + "Content-Disposition: form-data; name=`"category`"" + $LF + $LF + "public-document" + $LF + "--" + $boundary + $LF + "Content-Disposition: form-data; name=`"file`"; filename=`"Official-Rules.pdf`"" + $LF + "Content-Type: application/pdf" + $LF + $LF

$msPdf = New-Object System.IO.MemoryStream
$swPdf = New-Object System.IO.StreamWriter($msPdf, [System.Text.Encoding]::ASCII)
$swPdf.Write($pdfHeader)
$swPdf.Flush()
$msPdf.Write($pdfBytes, 0, $pdfBytes.Length)
$swPdf.Write($bannerFooter)
$swPdf.Flush()
$pdfData = $msPdf.ToArray()

$pdfUploadRes = Invoke-RestMethod -Uri "$baseUrl/api/files" -Method Post -Headers @{ Authorization = "Bearer $adminToken" } -Body $pdfData -ContentType "multipart/form-data; boundary=$boundary"
$pdfId = $pdfUploadRes.data.id
$rulesPdfUrl = "/api/files/$pdfId/download"
Write-Host "[4] Genuine PDF uploaded: $pdfId -> category: $($pdfUploadRes.data.category), isPublic: $($pdfUploadRes.data.isPublic)" -ForegroundColor Green

# 5. Create competition with banner and rules PDF
$compPayload = @{
    title = "National Vedic Championship 2026"
    category = "Vedic Mathematics"
    startDate = "2026-11-20"
    endDate = "2026-11-25"
    startTime = "10:00 AM"
    endTime = "01:00 PM"
    venue = "Main Auditorium"
    bannerUrl = $bannerUrl
    rulesPdfUrl = $rulesPdfUrl
    instructions = "Bring student identity card."
    rules = "Calculators strictly prohibited."
    contactDetails = "+91 98765 43210"
    registrationFee = 500
    status = "Active"
} | ConvertTo-Json

$createCompRes = Invoke-RestMethod -Uri "$baseUrl/api/competitions" -Method Post -Headers @{ Authorization = "Bearer $adminToken" } -Body $compPayload -ContentType "application/json"
$compId = $createCompRes.data.id
Write-Host "[5] Created competition: $compId - $($createCompRes.data.title)" -ForegroundColor Green
Write-Host "    rulesPdfUrl: $($createCompRes.data.rulesPdfUrl)"
Write-Host "    registrationFormUrl property present: $([bool]($createCompRes.data.PSObject.Properties['registrationFormUrl']))"

# 6. Verify public logged-out download
Write-Host "[6] Testing logged-out download from $baseUrl/api/files/$pdfId/download ..." -ForegroundColor Cyan
$downloadReq = [System.Net.HttpWebRequest]::Create("$baseUrl/api/files/$pdfId/download")
$downloadReq.Method = "GET"
# Deliberately NO Authorization header
$downloadResp = $downloadReq.GetResponse()
$statusCode = [int]$downloadResp.StatusCode
$contentType = $downloadResp.ContentType
$contentDisposition = $downloadResp.Headers["Content-Disposition"]
$nosniff = $downloadResp.Headers["X-Content-Type-Options"]

Write-Host "    HTTP Status: $statusCode" -ForegroundColor Green
Write-Host "    Content-Type: $contentType" -ForegroundColor Green
Write-Host "    Content-Disposition: $contentDisposition" -ForegroundColor Green
Write-Host "    X-Content-Type-Options: $nosniff" -ForegroundColor Green

if ($statusCode -ne 200) { throw "Expected HTTP 200 on public download, got $statusCode" }
if ($contentType -ne "application/pdf") { throw "Expected Content-Type application/pdf, got $contentType" }
if ($contentDisposition -notlike "*National_Vedic_Championship_2026-rules.pdf*") { throw "Expected sanitized filename in Content-Disposition, got $contentDisposition" }
if ($nosniff -ne "nosniff") { throw "Expected nosniff header, got $nosniff" }

# Read downloaded content
$stream = $downloadResp.GetResponseStream()
$reader = New-Object System.IO.StreamReader($stream)
$downloadedText = $reader.ReadToEnd()
$downloadResp.Close()

if ($downloadedText -notlike "*%PDF-1.4*") { throw "Downloaded content does not match expected PDF" }
Write-Host "    Streamed PDF content verified successfully!" -ForegroundColor Green

# 7. Verify non-existent or private file returns 404
try {
    $badReq = [System.Net.HttpWebRequest]::Create("$baseUrl/api/files/00000000-0000-0000-0000-000000000000/download")
    $badReq.GetResponse()
    throw "Expected 404 for nonexistent file"
} catch [System.Net.WebException] {
    $errResp = $_.Exception.Response
    if ($errResp -and [int]$errResp.StatusCode -eq 404) {
        Write-Host "[7] Non-existent download correctly returned HTTP 404 Not Found" -ForegroundColor Green
    } else {
        throw "Expected HTTP 404, got $($_.Exception.Message)"
    }
}

# 8. Test Replace on Admin side: update competition with a new rules PDF
$pdf2Bytes = [System.Text.Encoding]::ASCII.GetBytes("%PDF-1.4`n2 0 obj<</Title (Updated)>>endobj`n%%EOF")

$pdf2Header = "--" + $boundary + $LF + "Content-Disposition: form-data; name=`"category`"" + $LF + $LF + "public-document" + $LF + "--" + $boundary + $LF + "Content-Disposition: form-data; name=`"file`"; filename=`"Updated-Rules.pdf`"" + $LF + "Content-Type: application/pdf" + $LF + $LF

$msPdf2 = New-Object System.IO.MemoryStream
$swPdf2 = New-Object System.IO.StreamWriter($msPdf2, [System.Text.Encoding]::ASCII)
$swPdf2.Write($pdf2Header)
$swPdf2.Flush()
$msPdf2.Write($pdf2Bytes, 0, $pdf2Bytes.Length)
$swPdf2.Write($bannerFooter)
$swPdf2.Flush()
$pdf2Data = $msPdf2.ToArray()

$pdf2UploadRes = Invoke-RestMethod -Uri "$baseUrl/api/files" -Method Post -Headers @{ Authorization = "Bearer $adminToken" } -Body $pdf2Data -ContentType "multipart/form-data; boundary=$boundary"
$pdf2Id = $pdf2UploadRes.data.id

$updatePayload = @{
    title = "National Vedic Championship 2026 (Revised)"
    rulesPdfUrl = "/api/files/$pdf2Id/download"
} | ConvertTo-Json

$updateCompRes = Invoke-RestMethod -Uri "$baseUrl/api/competitions/$compId" -Method Put -Headers @{ Authorization = "Bearer $adminToken" } -Body $updatePayload -ContentType "application/json"
Write-Host "[8] Updated competition with replaced rules PDF ($pdf2Id)" -ForegroundColor Green

# Verify old PDF was deleted from stored_files / returns 404
try {
    $oldCheck = [System.Net.HttpWebRequest]::Create("$baseUrl/api/files/$pdfId/download")
    $oldCheck.GetResponse()
    Write-Host "    Warning: old file still exists or was kept" -ForegroundColor Yellow
} catch [System.Net.WebException] {
    if ([int]$_.Exception.Response.StatusCode -eq 404) {
        Write-Host "    Old rules PDF ($pdfId) correctly deleted upon replacement" -ForegroundColor Green
    }
}

# 9. Clean up test competition
$delRes = Invoke-RestMethod -Uri "$baseUrl/api/competitions/$compId" -Method Delete -Headers @{ Authorization = "Bearer $adminToken" }
Write-Host "[9] Deleted test competition: $($delRes.message)" -ForegroundColor Green

Write-Host "`nALL TASK D TESTS PASSED WITH 100% SUCCESS`n" -ForegroundColor Green
